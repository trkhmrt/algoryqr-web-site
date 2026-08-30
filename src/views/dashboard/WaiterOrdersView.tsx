"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import {
  DigitalMenuPicker,
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { useWaiterPanelAccess } from "@/components/dashboard/waiter/WaiterPanelAccess";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DateRangeFilter, openQueueDateRange } from "@/components/ui/date-range-filter";
import { Input } from "@/components/ui/input";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useListQueryState } from "@/hooks/use-list-query-state";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  confirmMerchantOrder,
  listMerchantOrders,
  OrderingApiError,
  rejectMerchantOrder,
  type OrderResponse,
} from "@/lib/ordering-api";
import { formatMenuPrice } from "@/components/menu-templates/types";

function formatWhen(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
}

function parseYmd(value: string, end = false): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T${end ? "23:59:59.999" : "00:00:00"}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function orderTimestamp(order: OrderResponse): number | null {
  const raw = order.submittedAt || order.createdAt;
  if (!raw) return null;
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? null : time;
}

function orderCustomerName(order: OrderResponse): string {
  const name = order.customerName?.trim();
  return name || "Misafir";
}

function OrderCard({
  order,
  busy,
  onConfirm,
  onReject,
}: {
  order: OrderResponse;
  busy: boolean;
  onConfirm: () => void;
  onReject: () => void;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{order.tableName || "Masa"}</h2>
          <p className="text-sm text-muted-foreground">
            {orderCustomerName(order)} · #{order.id} · {formatWhen(order.submittedAt || order.createdAt)}
          </p>
        </div>
        <p className="text-base font-semibold">
          {formatMenuPrice(order.totalAmount ?? undefined, order.currency || "TRY")}
        </p>
      </div>

      <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
        {(order.items ?? []).map((item) => (
          <li key={`${order.id}-${item.id ?? item.productId}`} className="text-sm">
            <span className="font-medium">{item.quantity}×</span>{" "}
            {item.productName || `#${item.productId}`}
            {item.note ? (
              <span className="block text-xs text-muted-foreground">Not: {item.note}</span>
            ) : null}
          </li>
        ))}
      </ul>

      {order.note ? (
        <p className="mt-2 rounded-md bg-muted/50 px-2 py-1.5 text-sm text-muted-foreground">
          Sipariş notu: {order.note}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          type="button"
          size="lg"
          className="h-12 text-base"
          disabled={busy}
          onClick={onConfirm}
        >
          Onayla
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-12 text-base"
          disabled={busy}
          onClick={onReject}
        >
          Reddet
        </Button>
      </div>
    </article>
  );
}

export default function WaiterOrdersView() {
  const router = useRouter();
  const { searchParams, setQuery } = useListQueryState();
  const qrFromQuery = Number(searchParams.get("qr"));
  const initialQrId = Number.isFinite(qrFromQuery) && qrFromQuery > 0 ? qrFromQuery : null;
  const { notify } = useDashboardBanners();
  const queryClient = useQueryClient();
  const [range, setRange] = useState(() => ({
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
  }));
  const [customerQuery, setCustomerQuery] = useState(() => searchParams.get("q") ?? "");
  const [pendingAction, setPendingAction] = useState<{
    orderId: number;
    action: "confirm" | "reject";
  } | null>(null);
  const debouncedCustomer = useDebouncedValue(customerQuery);

  const { accessLoading: waiterAccessLoading, canUseWaiterPanel } = useWaiterPanelAccess();
  const { accessLoading: menuAccessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const accessLoading = waiterAccessLoading || menuAccessLoading;
  const { menuQrs, selection, loading, error, selectQrId } = useDigitalMenuSelection(
    initialQrId,
    canUseWaiterPanel && canUseDigitalMenu && !accessLoading,
  );

  const menuId = selection?.menu.menuId ?? null;

  const ordersQuery = useQuery({
    queryKey: ["menu-orders-submitted", menuId],
    enabled: menuId != null,
    queryFn: () => listMerchantOrders(menuId!, "SUBMITTED"),
    refetchInterval: 6_000,
  });

  const filteredOrders = useMemo(() => {
    const orders = ordersQuery.data ?? [];
    const from = parseYmd(range.from, false);
    const to = parseYmd(range.to, true);
    const query = debouncedCustomer.trim().toLowerCase();

    return orders.filter((order) => {
      const timestamp = orderTimestamp(order);
      if (from && (timestamp == null || timestamp < from.getTime())) return false;
      if (to && (timestamp == null || timestamp > to.getTime())) return false;
      if (!query) return true;
      const name = orderCustomerName(order).toLowerCase();
      const email = (order.customerEmail || "").trim().toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [debouncedCustomer, ordersQuery.data, range.from, range.to]);

  const actionMutation = useMutation({
    mutationFn: async (payload: { orderId: number; action: "confirm" | "reject" }) => {
      if (payload.action === "confirm") {
        return confirmMerchantOrder(menuId!, payload.orderId);
      }
      return rejectMerchantOrder(menuId!, payload.orderId);
    },
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({ queryKey: ["menu-orders-submitted", menuId] });
      notify("info", vars.action === "confirm" ? "Sipariş onaylandı." : "Sipariş reddedildi.");
    },
    onError: (err) => {
      notify("danger", err instanceof OrderingApiError ? err.message : "İşlem başarısız.");
    },
  });

  if (accessLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const orders = ordersQuery.data ?? [];

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sipariş Yönetimi</h1>
          <p className="text-sm text-muted-foreground">Onay bekleyen siparişler</p>
        </div>
        <Button asChild variant="outline">
          <a href={DASHBOARD_ROUTES.waiterPanel} target="_blank" rel="noopener noreferrer">
            Garson uygulamasını aç
          </a>
        </Button>
      </div>

      <DigitalMenuPicker
        menuQrs={menuQrs}
        selectedQrId={selection?.qr.id ?? null}
        onSelectQrId={(qrId) => {
          void selectQrId(qrId);
          router.replace(DASHBOARD_ROUTES.waiterForQr(qrId), { scroll: false });
        }}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {menuId ? (
        <div className="space-y-3">
          <DateRangeFilter
            value={range}
            onChange={(next) => {
              setRange(next);
              setQuery({ from: next.from || null, to: next.to || null });
            }}
          />
          <Input
            value={customerQuery}
            onChange={(event) => {
              const next = event.target.value;
              setCustomerQuery(next);
              setQuery({ q: next.trim() || null });
            }}
            placeholder="Müşteri adı"
            aria-label="Müşteri adı ile filtrele"
          />
        </div>
      ) : null}

      {!menuId ? (
        <EmptyState
          title="Menü seçin"
          description="Bekleyen siparişleri görmek için bir dijital menü seçin."
          action={
            <Button asChild variant="outline">
              <Link href={DASHBOARD_ROUTES.digitalMenu}>Menü & Şubeler</Link>
            </Button>
          }
        />
      ) : ordersQuery.isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="Bekleyen sipariş yok"
          description="Yeni siparişler burada görünür. Garson uygulamasından da sipariş alabilirsiniz."
          action={
            <Button asChild variant="outline">
              <a href={DASHBOARD_ROUTES.waiterPanel} target="_blank" rel="noopener noreferrer">
                Garson uygulamasını aç
              </a>
            </Button>
          }
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="Filtrelere uyan sipariş yok"
          description="Tarih veya müşteri filtresini temizleyip tekrar deneyin."
          action={
            <Button
              variant="outline"
              onClick={() => {
                const next = openQueueDateRange();
                setRange(next);
                setCustomerQuery("");
                setQuery({ from: null, to: null, q: null });
              }}
            >
              Filtreleri temizle
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              busy={actionMutation.isPending}
              onConfirm={() => setPendingAction({ orderId: order.id, action: "confirm" })}
              onReject={() => setPendingAction({ orderId: order.id, action: "reject" })}
            />
          ))}
        </div>
      )}

      <AlertDialog open={pendingAction != null} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.action === "reject" ? "Siparişi reddet?" : "Siparişi onayla?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.action === "reject"
                ? "Reddettiğiniz sipariş kuyruktan çıkar. Bu işlem geri alınamaz."
                : "Onaylanan sipariş hazırlık kuyruğuna geçer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className={pendingAction?.action === "reject" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
              onClick={() => {
                if (!pendingAction) return;
                actionMutation.mutate(pendingAction);
                setPendingAction(null);
              }}
            >
              {pendingAction?.action === "reject" ? "Reddet" : "Onayla"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
