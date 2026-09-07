"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";

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
import { Button } from "@/components/ui/button";
import { DateRangeFilter, openQueueDateRange } from "@/components/ui/date-range-filter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useListQueryState } from "@/hooks/use-list-query-state";
import { formatMenuPrice } from "@/components/menu-templates/types";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  DASHBOARD_FILTER_FIELD,
  DASHBOARD_FILTER_LABEL,
  DASHBOARD_STAT_TILE,
  DASHBOARD_SURFACE,
} from "@/lib/dashboard-surface";
import {
  listMerchantOrders,
  OrderingApiError,
  type OrderResponse,
  type OrderStatus,
} from "@/lib/ordering-api";
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

function amountNumber(value?: number | string | null): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function countsTowardRevenue(status: OrderStatus): boolean {
  return status === "CONFIRMED" || status === "SUBMITTED";
}

function itemSummary(order: OrderResponse): string {
  const items = order.items ?? [];
  if (items.length === 0) return "—";
  const first = items[0];
  const label = `${first.quantity}× ${first.productName || `#${first.productId}`}`;
  if (items.length === 1) return label;
  return `${label} +${items.length - 1}`;
}

function tipAmountByOrderId(orders: OrderResponse[]): Map<number, number> {
  const seenBillIds = new Set<number>();
  const tips = new Map<number, number>();

  for (const order of orders) {
    const tip = amountNumber(order.tipAmount);
    if (tip <= 0) continue;
    if (order.billId != null) {
      if (seenBillIds.has(order.billId)) continue;
      seenBillIds.add(order.billId);
    }
    tips.set(order.id, tip);
  }
  return tips;
}

function sumOrderRevenue(orders: OrderResponse[], includeTips: boolean): number {
  let total = 0;
  const revenueOrders: OrderResponse[] = [];
  for (const order of orders) {
    if (!countsTowardRevenue(order.status)) continue;
    total += amountNumber(order.totalAmount);
    revenueOrders.push(order);
  }
  if (!includeTips) return total;
  for (const tip of tipAmountByOrderId(revenueOrders).values()) {
    total += tip;
  }
  return total;
}

function sumTipRevenue(orders: OrderResponse[]): number {
  const revenueOrders = orders.filter((order) => countsTowardRevenue(order.status));
  let total = 0;
  for (const tip of tipAmountByOrderId(revenueOrders).values()) {
    total += tip;
  }
  return total;
}

export default function WaiterOrdersView() {
  const router = useRouter();
  const { searchParams, setQuery } = useListQueryState();
  const qrFromQuery = Number(searchParams.get("qr"));
  const initialQrId = Number.isFinite(qrFromQuery) && qrFromQuery > 0 ? qrFromQuery : null;
  const [range, setRange] = useState(() => ({
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
  }));
  const [customerQuery, setCustomerQuery] = useState(() => searchParams.get("q") ?? "");
  const [includeTips, setIncludeTips] = useState(() => searchParams.get("tips") === "1");
  const debouncedCustomer = useDebouncedValue(customerQuery);

  const { accessLoading: waiterAccessLoading, canUseWaiterPanel } = useWaiterPanelAccess();
  const { accessLoading: menuAccessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const accessLoading = waiterAccessLoading || menuAccessLoading;
  const { menuQrs, selection, loading, error, selectQrId } = useDigitalMenuSelection(
    initialQrId,
    canUseWaiterPanel && canUseDigitalMenu && !accessLoading,
  );

  const menuId = selection?.menu.menuId ?? null;
  const qrId = selection?.qr.id ?? null;

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

  const revenueTotal = useMemo(
    () => sumOrderRevenue(filteredOrders, false),
    [filteredOrders],
  );

  const tipTotal = useMemo(() => sumTipRevenue(filteredOrders), [filteredOrders]);

  const currency = filteredOrders[0]?.currency || ordersQuery.data?.[0]?.currency || "TRY";

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
        hint="Verilen siparişler — tablo ve detay"
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
          onSelectQrId={(nextQrId) => {
            void selectQrId(nextQrId);
            router.replace(DASHBOARD_ROUTES.waiterForQr(nextQrId), { scroll: false });
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
          <div className={cn(DASHBOARD_FILTER_FIELD, "min-w-[12rem] flex-1 sm:max-w-xs")}>
            <Label htmlFor="orders-customer-filter" className={DASHBOARD_FILTER_LABEL}>
              Ara
            </Label>
            <Input
              id="orders-customer-filter"
              value={customerQuery}
              onChange={(event) => {
                const next = event.target.value;
                setCustomerQuery(next);
                setQuery({ q: next.trim() || null });
              }}
              placeholder="Müşteri veya garson"
            />
          </div>
          <div className={cn(DASHBOARD_FILTER_FIELD, "min-w-[12rem]")}>
            <Label htmlFor="include-tips" className={DASHBOARD_FILTER_LABEL}>
              Bahşiş
            </Label>
            <div className="flex h-10 items-center justify-between gap-3 rounded-md border border-input bg-background px-3">
              <span className="text-sm text-foreground">Bahşişleri dahil et</span>
              <Switch
                id="include-tips"
                checked={includeTips}
                onCheckedChange={(checked) => {
                  setIncludeTips(checked);
                  setQuery({ tips: checked ? "1" : null });
                }}
              />
            </div>
          </div>
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
                setIncludeTips(false);
                setQuery({ from: null, to: null, q: null, tips: null });
              }}
            >
              Filtreleri temizle
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-stretch gap-3">
            <div className={cn(DASHBOARD_STAT_TILE, "w-fit min-w-[10.5rem] shrink-0")}>
              <p className="text-xs text-muted-foreground">Siparişlerden kazanılan toplam</p>
              <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
                {formatMenuPrice(revenueTotal, currency)}
              </p>
            </div>
            <AnimatePresence initial={false}>
              {includeTips ? (
                <motion.div
                  key="tip-card"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className={cn(DASHBOARD_STAT_TILE, "w-fit min-w-[8.5rem] shrink-0")}
                >
                  <p className="text-xs text-muted-foreground">Bahşiş</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
                    {formatMenuPrice(tipTotal, currency)}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className={`${DASHBOARD_SURFACE} overflow-hidden`}>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-10">Masa</TableHead>
                  <TableHead className="h-10">Durum</TableHead>
                  <TableHead className="h-10">Müşteri</TableHead>
                  <TableHead className="h-10">No</TableHead>
                  <TableHead className="h-10">Tarih</TableHead>
                  <TableHead className="h-10">Ürünler</TableHead>
                  <TableHead className="h-10 text-right">Tutar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const href = DASHBOARD_ROUTES.waiterOrderDetail(order.id, qrId);
                  const tip = amountNumber(order.tipAmount);
                  return (
                    <TableRow
                      key={order.id}
                      className={cn("cursor-pointer", order.status === "CANCELLED" && "opacity-70")}
                      onClick={() => router.push(href)}
                    >
                      <TableCell className="py-3 font-medium">{order.tableName || "Masa"}</TableCell>
                      <TableCell className="py-3">
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-xs font-medium",
                            order.status === "CANCELLED"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground">
                        {orderCustomerName(order)}
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground">#{order.id}</TableCell>
                      <TableCell className="py-3 text-muted-foreground">
                        {formatWhen(order.submittedAt || order.createdAt)}
                      </TableCell>
                      <TableCell className="max-w-[14rem] truncate py-3 text-muted-foreground">
                        {itemSummary(order)}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-medium tabular-nums">
                            {formatMenuPrice(
                              order.totalAmount ?? undefined,
                              order.currency || "TRY",
                            )}
                          </span>
                          <AnimatePresence initial={false}>
                            {includeTips ? (
                              <motion.span
                                key={`tip-${order.id}`}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                  "inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
                                  tip > 0
                                    ? "bg-orange-500/15 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300"
                                    : "bg-orange-500/10 text-orange-600/70 dark:bg-orange-400/10 dark:text-orange-300/70",
                                )}
                              >
                                {tip > 0
                                  ? `+${formatMenuPrice(tip, order.currency || "TRY")} bahşiş`
                                  : "Bahşiş yok"}
                              </motion.span>
                            ) : null}
                          </AnimatePresence>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
