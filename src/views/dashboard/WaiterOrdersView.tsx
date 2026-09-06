"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  DigitalMenuPicker,
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { useWaiterPanelAccess } from "@/components/dashboard/waiter/WaiterPanelAccess";
import { DashboardFilterBar } from "@/components/dashboard/DashboardFilterBar";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
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
import { DASHBOARD_LIST_ITEM } from "@/lib/dashboard-surface";
import {
  cancelMerchantOrder,
  listMerchantOrders,
  OrderingApiError,
  type OrderResponse,
  type OrderStatus,
} from "@/lib/ordering-api";
import { formatMenuPrice } from "@/components/menu-templates/types";
import { cn } from "@/lib/utils";

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
  if (name) return name;
  const waiter = order.waiterName?.trim();
  if (waiter) return waiter;
  return "Misafir";
}

function statusLabel(status: OrderStatus): string {
  switch (status) {
    case "CANCELLED":
      return "İptal edildi";
    case "REJECTED":
      return "Reddedildi";
    case "CONFIRMED":
      return "Alındı";
    case "SUBMITTED":
      return "Alındı";
    default:
      return String(status);
  }
}

function canCancelOrder(status: OrderStatus): boolean {
  return status === "CONFIRMED" || status === "SUBMITTED";
}

function OrderCard({
  order,
  busy,
  onCancel,
}: {
  order: OrderResponse;
  busy: boolean;
  onCancel: () => void;
}) {
  const cancelled = order.status === "CANCELLED";

  return (
    <article className={cn(DASHBOARD_LIST_ITEM, cancelled && "opacity-80")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{order.tableName || "Masa"}</h2>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-medium",
                cancelled
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {statusLabel(order.status)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {orderCustomerName(order)} · #{order.id} · {formatWhen(order.submittedAt || order.createdAt)}
          </p>
          {order.waiterName ? (
            <p className="text-xs text-muted-foreground">Garson: {order.waiterName}</p>
          ) : null}
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
            {item.selectedOptions?.length ? (
              <span className="block text-xs text-muted-foreground">
                {item.selectedOptions
                  .map((option) => option.optionName)
                  .filter(Boolean)
                  .join(", ")}
              </span>
            ) : null}
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

      {order.waiterNote ? (
        <p className="mt-2 rounded-md bg-muted/50 px-2 py-1.5 text-sm text-muted-foreground">
          Garson notu: {order.waiterNote}
        </p>
      ) : null}

      {canCancelOrder(order.status) ? (
        <div className="mt-4">
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-12 w-full text-base"
            disabled={busy}
            onClick={onCancel}
          >
            İptal et
          </Button>
        </div>
      ) : null}
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
  const [pendingCancelId, setPendingCancelId] = useState<number | null>(null);
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
    queryKey: ["menu-orders", menuId],
    enabled: menuId != null,
    queryFn: () => listMerchantOrders(menuId!, "ALL"),
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
      const waiter = (order.waiterName || "").trim().toLowerCase();
      return name.includes(query) || email.includes(query) || waiter.includes(query);
    });
  }, [debouncedCustomer, ordersQuery.data, range.from, range.to]);

  const cancelMutation = useMutation({
    mutationFn: (orderId: number) => cancelMerchantOrder(menuId!, orderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["menu-orders", menuId] });
      notify("info", "Sipariş iptal edildi.");
    },
    onError: (err) => {
      notify("danger", err instanceof OrderingApiError ? err.message : "İptal başarısız.");
    },
  });

  if (accessLoading || loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <DashboardPageHeader title="Sipariş Yönetimi" hint="Verilen siparişler" />
        <DashboardLoadingState label="Sipariş yönetimi hazırlanıyor..." />
      </div>
    );
  }

  const orders = ordersQuery.data ?? [];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <DashboardPageHeader
        title="Sipariş Yönetimi"
        hint="Verilen siparişler — detay ve iptal"
        action={
          <Button asChild variant="outline">
            <a href={DASHBOARD_ROUTES.waiterPanel} target="_blank" rel="noopener noreferrer">
              Garson uygulamasını aç
            </a>
          </Button>
        }
      />

      <DashboardFilterBar>
        <DigitalMenuPicker
          menuQrs={menuQrs}
          selectedQrId={selection?.qr.id ?? null}
          onSelectQrId={(qrId) => {
            void selectQrId(qrId);
            router.replace(DASHBOARD_ROUTES.waiterForQr(qrId), { scroll: false });
          }}
        />
      </DashboardFilterBar>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {ordersQuery.isError ? (
        <p className="text-sm text-destructive">
          {ordersQuery.error instanceof OrderingApiError
            ? ordersQuery.error.message
            : "Siparişler yüklenemedi"}
        </p>
      ) : null}

      {menuId ? (
        <DashboardFilterBar>
          <DateRangeFilter
            value={range}
            onChange={(next) => {
              setRange(next);
              setQuery({ from: next.from || null, to: next.to || null });
            }}
          />
          <Input
            className="min-w-[12rem] flex-1"
            value={customerQuery}
            onChange={(event) => {
              const next = event.target.value;
              setCustomerQuery(next);
              setQuery({ q: next.trim() || null });
            }}
            placeholder="Müşteri veya garson"
            aria-label="Müşteri veya garson ile filtrele"
          />
        </DashboardFilterBar>
      ) : null}

      {!menuId ? (
        <EmptyState
          title="Menü seçin"
          description="Siparişleri görmek için bir dijital menü seçin."
          action={
            <Button asChild variant="outline">
              <Link href={DASHBOARD_ROUTES.digitalMenu}>Menü & Şubeler</Link>
            </Button>
          }
        />
      ) : ordersQuery.isLoading ? (
        <DashboardLoadingState label="Siparişler yükleniyor..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="Henüz sipariş yok"
          description="Garson veya müşteri siparişleri burada detaylı görünür."
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
          description="Tarih veya arama filtresini temizleyip tekrar deneyin."
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
              busy={cancelMutation.isPending}
              onCancel={() => setPendingCancelId(order.id)}
            />
          ))}
        </div>
      )}

      <AlertDialog
        open={pendingCancelId != null}
        onOpenChange={(open) => !open && setPendingCancelId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Siparişi iptal et?</AlertDialogTitle>
            <AlertDialogDescription>
              İptal edilen sipariş listede İptal edildi olarak görünür. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingCancelId == null) return;
                cancelMutation.mutate(pendingCancelId);
                setPendingCancelId(null);
              }}
            >
              İptal et
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
