"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

import {
  DigitalMenuPicker,
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlidingTabSelect } from "@/components/ui/sliding-tab-select";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  confirmMerchantOrder,
  listMerchantOrders,
  OrderingApiError,
  rejectMerchantOrder,
  type OrderResponse,
} from "@/lib/ordering-api";
import { formatMenuPrice } from "@/components/menu-templates/types";

type PeriodFilter = "today" | "7d" | "custom";

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

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function parseDateInput(value: string, end = false): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return end ? endOfDay(parsed) : startOfDay(parsed);
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
  const searchParams = useSearchParams();
  const qrFromQuery = Number(searchParams.get("qr"));
  const initialQrId = Number.isFinite(qrFromQuery) && qrFromQuery > 0 ? qrFromQuery : null;
  const { notify } = useDashboardBanners();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<PeriodFilter>("today");
  const [customerQuery, setCustomerQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const { menuQrs, selection, loading, error, selectQrId } = useDigitalMenuSelection(
    initialQrId,
    canUseDigitalMenu && !accessLoading,
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
    const now = new Date();
    let from: Date | null = null;
    let to: Date | null = null;

    if (period === "today") {
      from = startOfDay(now);
      to = endOfDay(now);
    } else if (period === "7d") {
      const start = startOfDay(now);
      start.setDate(start.getDate() - 6);
      from = start;
      to = endOfDay(now);
    } else {
      from = parseDateInput(fromDate, false);
      to = parseDateInput(toDate, true);
    }

    const query = customerQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const timestamp = orderTimestamp(order);
      if (from && (timestamp == null || timestamp < from.getTime())) return false;
      if (to && (timestamp == null || timestamp > to.getTime())) return false;
      if (!query) return true;
      const name = orderCustomerName(order).toLowerCase();
      const email = (order.customerEmail || "").trim().toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [customerQuery, fromDate, ordersQuery.data, period, toDate]);

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

  if (!canUseDigitalMenu) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link href={DASHBOARD_ROUTES.orderPanel}>Sipariş Paneline Dön</Link>
        </Button>
        <p className="text-sm text-muted-foreground">Bu özellik için PRO paket gerekir.</p>
      </div>
    );
  }

  const orders = ordersQuery.data ?? [];

  return (
    <div className="mx-auto w-full max-w-lg space-y-4 animate-fade-in pb-8">
      <div className="flex items-center gap-3">
        <Link
          href={DASHBOARD_ROUTES.orderPanel}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Siparişler</h1>
          <p className="text-sm text-muted-foreground">Sipariş panelinden gelen onay bekleyen siparişler</p>
        </div>
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
          <SlidingTabSelect
            size="sm"
            ariaLabel="Dönem"
            value={period}
            onValueChange={(next) => setPeriod(next as PeriodFilter)}
            items={[
              { value: "today", label: "Bugün" },
              { value: "7d", label: "7 Gün" },
              { value: "custom", label: "Tarih aralığı" },
            ]}
          />
          <Input
            value={customerQuery}
            onChange={(event) => setCustomerQuery(event.target.value)}
            placeholder="Müşteri adı"
            aria-label="Müşteri adı ile filtrele"
          />
          {period === "custom" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground" htmlFor="order-from-date">
                  Başlangıç
                </label>
                <Input
                  id="order-from-date"
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground" htmlFor="order-to-date">
                  Bitiş
                </label>
                <Input
                  id="order-to-date"
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!menuId ? (
        <p className="text-sm text-muted-foreground">Menü seçin.</p>
      ) : ordersQuery.isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div
          className="rounded-lg border border-dashed px-4 py-12 text-center text-sm"
          style={{
            borderColor: "hsl(var(--chart-teal) / 0.28)",
            backgroundImage:
              "linear-gradient(180deg, hsl(var(--chart-teal) / 0.32) 0%, hsl(var(--chart-teal) / 0.20) 32%, hsl(var(--chart-teal) / 0.08) 62%, hsl(var(--chart-teal) / 0) 100%)",
            color: "hsl(var(--chart-teal))",
          }}
        >
          Bekleyen sipariş yok.
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          Filtrelere uyan sipariş yok.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              busy={actionMutation.isPending}
              onConfirm={() =>
                actionMutation.mutate({ orderId: order.id, action: "confirm" })
              }
              onReject={() =>
                actionMutation.mutate({ orderId: order.id, action: "reject" })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
