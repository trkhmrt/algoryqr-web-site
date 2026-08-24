"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DateRangeFilter, type DateRangeValue } from "@/components/ui/date-range-filter";
import { IntegrationsSectionHeader } from "@/components/dashboard/IntegrationsSectionHeader";
import { useDigitalMenuAccess } from "@/components/dashboard/menu/DigitalMenuPicker";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { useBranches } from "@/hooks/use-branches";
import { ApiError } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  acceptTrendyolGoOrder,
  cancelTrendyolGoOrder,
  listTrendyolGoOrders,
  readyTrendyolGoOrder,
  rejectTrendyolGoOrder,
  syncTrendyolGoOrders,
  type TrendyolGoOrder,
} from "@/lib/trendyol-go-api";
import {
  deliveryTypeLabel,
  displayValue,
  formatOrderReference,
  formatTrendyolGoAmount,
  formatTrendyolGoDateTime,
  packageStatusClass,
  packageStatusLabel,
  paymentMethodLabel,
  TGO_SOFT_CARD_CLASS,
  TGO_SOFT_FIELD_CLASS,
} from "@/lib/trendyol-go-ui";

const STATUS_FILTERS = [
  { value: "", label: "Tüm durumlar" },
  { value: "Created", label: "Yeni sipariş" },
  { value: "Accepted", label: "Kabul edildi" },
  { value: "Prepared", label: "Hazır" },
  { value: "Rejected", label: "Reddedildi" },
  { value: "Cancelled", label: "İptal edildi" },
] as const;

function createDefaultDateRange(): DateRangeValue {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 29);
  const pad = (value: number) => String(value).padStart(2, "0");
  const format = (date: Date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return { from: format(from), to: format(today) };
}

function formatDateRangeLabel(from: string, to: string): string {
  if (!from && !to) return "seçili dönem";
  if (from && to) return `${from} – ${to}`;
  return from || to;
}

export default function TrendyolGoOrdersView() {
  const { notify } = useDashboardBanners();
  const queryClient = useQueryClient();
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const branchesQuery = useBranches(canUseDigitalMenu && !accessLoading);
  const branches = branchesQuery.data?.content ?? [];
  const [branchId, setBranchId] = useState<number | null>(null);
  const selectedBranchId = branchId ?? branches[0]?.id ?? null;
  const [status, setStatus] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>(createDefaultDateRange);
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<number | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["tgo-orders", selectedBranchId, status, dateRange.from, dateRange.to, page],
    queryFn: () =>
      listTrendyolGoOrders(selectedBranchId as number, status, page, {
        from: dateRange.from || undefined,
        to: dateRange.to || undefined,
      }),
    enabled: selectedBranchId != null && canUseDigitalMenu,
  });

  const syncMutation = useMutation({
    mutationFn: () =>
      syncTrendyolGoOrders(selectedBranchId as number, {
        from: dateRange.from || undefined,
        to: dateRange.to || undefined,
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["tgo-orders"] });
      const rangeLabel =
        result.from && result.to
          ? `${result.from} – ${result.to}`
          : formatDateRangeLabel(dateRange.from, dateRange.to);
      notify("info", `TGO senkronu tamamlandı. ${result.upserted} sipariş güncellendi (${rangeLabel}).`);
    },
    onError: (error) => {
      notify("danger", error instanceof ApiError ? error.message : "TGO siparişleri senkronize edilemedi.");
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ orderId, action }: { orderId: number; action: "accept" | "reject" | "cancel" | "ready" }) => {
      const id = selectedBranchId as number;
      if (action === "accept") return acceptTrendyolGoOrder(id, orderId);
      if (action === "reject") return rejectTrendyolGoOrder(id, orderId);
      if (action === "cancel") return cancelTrendyolGoOrder(id, orderId);
      return readyTrendyolGoOrder(id, orderId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tgo-orders"] });
      notify("info", "Sipariş güncellendi.");
    },
    onError: (error) => {
      notify("danger", error instanceof ApiError ? error.message : "Sipariş güncellenemedi.");
    },
  });

  const orders = ordersQuery.data?.content ?? [];
  const totalPages = ordersQuery.data?.totalPages ?? 0;
  const totalElements = ordersQuery.data?.totalElements ?? 0;

  const statusCounts = useMemo(() => {
    const counts = { new: 0, active: 0, done: 0 };
    for (const order of orders) {
      const normalized = order.packageStatus?.trim().toLowerCase().replace(/[\s_-]+/g, "") ?? "";
      if (normalized === "created" || normalized === "unassigned") counts.new += 1;
      else if (normalized === "accepted" || normalized === "picking" || normalized === "prepared" || normalized === "ready")
        counts.active += 1;
      else counts.done += 1;
    }
    return counts;
  }, [orders]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href={DASHBOARD_ROUTES.integrations}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Entegrasyonlar
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <IntegrationsSectionHeader
          pageTitle="Siparişler"
          pageDescription="Uber Eats Trendyol Go Yemek sipariş takibi"
        />
        <div className="flex shrink-0 flex-wrap gap-2 lg:pt-8">
          <Button
            variant="secondary"
            disabled={selectedBranchId == null || syncMutation.isPending}
            onClick={() => syncMutation.mutate()}
          >
            {syncMutation.isPending ? "Senkronize ediliyor..." : "TGO'dan senkronize et"}
          </Button>
          <Button asChild variant="outline">
            <Link href={DASHBOARD_ROUTES.trendyolGo}>Bağlantı</Link>
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Liste yerel veritabanındaki senkronize siparişleri gösterir. Tarih aralığını seçin, ardından
        &quot;TGO&apos;dan senkronize et&quot; ile o dönemin siparişlerini çekin.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`${TGO_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">Bu sayfada yeni</p>
          <p className="mt-1 text-xl font-semibold">{statusCounts.new}</p>
        </div>
        <div className={`${TGO_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">İşlemde</p>
          <p className="mt-1 text-xl font-semibold">{statusCounts.active}</p>
        </div>
        <div className={`${TGO_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">Seçili dönemde toplam</p>
          <p className="mt-1 text-xl font-semibold">{totalElements}</p>
        </div>
      </div>

      <div className={`${TGO_SOFT_CARD_CLASS} p-4 sm:p-5`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="min-w-[180px] flex-1 space-y-1.5">
            <label className="text-xs text-muted-foreground">Şube</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selectedBranchId ?? ""}
              onChange={(event) => {
                setBranchId(Number(event.target.value));
                setPage(0);
              }}
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <DateRangeFilter
            className="min-w-0 flex-1"
            value={dateRange}
            onChange={(next) => {
              setDateRange(next);
              setPage(0);
            }}
          />
          <div className="min-w-[180px] flex-1 space-y-1.5">
            <label className="text-xs text-muted-foreground">Durum</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(0);
              }}
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {ordersQuery.isLoading ? (
          <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Siparişler yükleniyor…
          </div>
        ) : ordersQuery.isError ? (
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-destructive">
            Siparişler alınamadı. Önce restoran bağlayın.
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            Bu filtrelerle sipariş yok.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                open={openId === order.id}
                onToggle={() => setOpenId((current) => (current === order.id ? null : order.id))}
                busy={actionMutation.isPending}
                onAction={(action) => actionMutation.mutate({ orderId: order.id, action })}
              />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
            <p className="text-xs text-muted-foreground">
              Sayfa {page + 1} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((prev) => prev - 1)}>
                Önceki
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Sonraki
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function orderDisplayReference(order: TrendyolGoOrder): string {
  if (order.orderNumber?.trim()) {
    return order.orderNumber.trim();
  }
  return formatOrderReference(order.externalOrderId);
}

function OrderCard({
  order,
  open,
  onToggle,
  busy,
  onAction,
}: {
  order: TrendyolGoOrder;
  open: boolean;
  onToggle: () => void;
  busy: boolean;
  onAction: (action: "accept" | "reject" | "cancel" | "ready") => void;
}) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article className={`${TGO_SOFT_CARD_CLASS} overflow-hidden`}>
      <button
        type="button"
        className="flex w-full items-start gap-4 p-4 text-left sm:p-5"
        onClick={onToggle}
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{orderDisplayReference(order)}</p>
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${packageStatusClass(order.packageStatus)}`}
            >
              {packageStatusLabel(order.packageStatus)}
            </span>
          </div>
          <p className="text-sm text-foreground">{order.customerName || "Müşteri bilgisi yok"}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>{formatTrendyolGoDateTime(order.packageCreatedAt)}</span>
            <span>{itemCount} ürün</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <p className="text-base font-semibold text-foreground">
            {formatTrendyolGoAmount(order.totalAmount, order.currency ?? "TRY")}
          </p>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open ? (
        <div className="space-y-4 border-t border-[#e5e7eb] px-4 pb-5 pt-4 dark:border-border sm:px-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailField label="Sipariş no" value={displayValue(order.orderNumber ?? order.externalOrderId)} />
            <DetailField label="Paket no" value={displayValue(order.externalOrderId)} />
            <DetailField label="Teslimat tipi" value={deliveryTypeLabel(order.deliveryType)} />
            <DetailField label="Ödeme yöntemi" value={paymentMethodLabel(order.paymentMethod)} />
            <DetailField label="Telefon" value={displayValue(order.customerPhone)} />
            <DetailField label="Adres" value={displayValue(order.deliveryAddress)} className="sm:col-span-2" />
          </div>

          {order.note ? (
            <div className={TGO_SOFT_FIELD_CLASS}>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Sipariş notu</p>
              <p className="mt-0.5 text-sm text-foreground">{order.note}</p>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Detay ürünler</p>
            {order.items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                Ürün detayı bulunamadı.
              </div>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-border">
                {order.items.map((item, index) => {
                  const detail = item.detail || item.options;
                  return (
                    <li
                      key={`${item.productId ?? index}`}
                      className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          {item.quantity}× {item.productName || "Ürün"}
                        </p>
                        {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
                      </div>
                      {item.unitPrice != null ? (
                        <p className="shrink-0 text-muted-foreground">
                          {formatTrendyolGoAmount(item.unitPrice, order.currency ?? "TRY")}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={busy} onClick={() => onAction("accept")}>
              Kabul et
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => onAction("ready")}>
              Hazır
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onAction("reject")}>
              Reddet
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onAction("cancel")}>
              İptal et
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`${TGO_SOFT_FIELD_CLASS} ${className ?? ""}`}>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
