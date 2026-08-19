"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, Loader2, LogOut, Plus } from "lucide-react";

import { formatMenuPrice } from "@/components/menu-templates/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { cn } from "@/lib/utils";
import type { OrderResponse } from "@/lib/ordering-api";
import {
  confirmWaiterOrder,
  getWaiterOrder,
  listWaiterPendingOrders,
  listWaiterTableTodayOrders,
  listWaiterTables,
  listWaiterTodayOrders,
  rejectWaiterOrder,
  cancelWaiterOrder,
  WaiterApiError,
  waiterLogout,
  waiterMe,
  updateWaiterOrderNote,
  type WaiterMe,
  type WaiterTableSummary,
} from "@/lib/waiter-api";
import WaiterCreateOrderView from "@/views/waiter/WaiterCreateOrderView";
import WaiterBillDetailView from "@/views/waiter/WaiterBillDetailView";
import WaiterCommissionPanel from "@/views/waiter/WaiterCommissionPanel";
import { WaiterCampaignPanel } from "@/views/waiter/WaiterCampaignPanel";
import { useWaiterTokenRefresh } from "@/hooks/use-waiter-token-refresh";

type TabKey = "pending" | "tables" | "today" | "commission" | "campaigns";
type TableCardTone = "open" | "pending" | "closed";

function getTableCardTone(table: WaiterTableSummary): TableCardTone {
  if (table.pendingOrderCount > 0) return "pending";
  if (table.billStatus === "OPEN") return "open";
  return "closed";
}

function tableCardToneClasses(tone: TableCardTone): string {
  switch (tone) {
    case "open":
      return "border-chart-green bg-chart-green text-white hover:bg-chart-green/85";
    case "pending":
      return "animate-waiter-pending-bounce border-orange-600 bg-orange-500 text-white hover:bg-orange-600";
    case "closed":
      return "border-red-600 bg-red-500 text-white hover:bg-red-600";
  }
}

function tableCardSubtitle(table: WaiterTableSummary, tone: TableCardTone): string {
  if (tone === "pending") {
    return `${table.pendingOrderCount} sipariş onay bekliyor`;
  }
  if (tone === "open") {
    return "Adisyon açık";
  }
  return "Kapalı";
}

function tableCardStatusLabel(tone: TableCardTone): string {
  switch (tone) {
    case "open":
      return "Açık";
    case "pending":
      return "Onay bekliyor";
    case "closed":
      return "Kapalı";
  }
}

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

function statusLabel(status?: string | null): string {
  switch (status) {
    case "SUBMITTED":
      return "Bekleyen";
    case "CONFIRMED":
      return "Onaylandı";
    case "REJECTED":
      return "Reddedildi";
    case "CANCELLED":
      return "İptal edildi";
    default:
      return status || "—";
  }
}

export default function WaiterPanelView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>("pending");
  const [selectedTable, setSelectedTable] = useState<WaiterTableSummary | null>(null);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [createOrderTable, setCreateOrderTable] = useState<WaiterTableSummary | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [me, setMe] = useState<WaiterMe | null | undefined>(undefined);

  useWaiterTokenRefresh();

  useEffect(() => {
    let cancelled = false;
    waiterMe()
      .then((profile) => {
        if (cancelled) return;
        if (!profile) {
          router.replace(DASHBOARD_ROUTES.waiterLogin);
          return;
        }
        setMe(profile);
      })
      .catch(() => {
        if (!cancelled) router.replace(DASHBOARD_ROUTES.waiterLogin);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const pendingQuery = useQuery({
    queryKey: ["waiter-orders-pending"],
    enabled: me != null && tab === "pending",
    queryFn: listWaiterPendingOrders,
    refetchInterval: 6_000,
  });

  const tablesQuery = useQuery({
    queryKey: ["waiter-orders-tables"],
    enabled: me != null && tab === "tables" && selectedTable == null,
    queryFn: listWaiterTables,
    refetchInterval: 8_000,
  });

  const tableOrdersQuery = useQuery({
    queryKey: ["waiter-table-today", selectedTable?.tableId],
    enabled: me != null && tab === "tables" && selectedTable != null,
    queryFn: () => listWaiterTableTodayOrders(selectedTable!.tableId),
    refetchInterval: 8_000,
  });

  const todayQuery = useQuery({
    queryKey: ["waiter-orders-today"],
    enabled: me != null && tab === "today",
    queryFn: listWaiterTodayOrders,
    refetchInterval: 10_000,
  });

  const actionMutation = useMutation({
    mutationFn: async (payload: {
      orderId: number;
      action: "confirm" | "reject";
      note?: string;
    }) => {
      if (payload.note?.trim()) {
        await updateWaiterOrderNote(payload.orderId, payload.note.trim());
      }
      if (payload.action === "confirm") {
        return confirmWaiterOrder(payload.orderId);
      }
      return rejectWaiterOrder(payload.orderId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["waiter-orders-pending"] }),
        queryClient.invalidateQueries({ queryKey: ["waiter-orders-today"] }),
        queryClient.invalidateQueries({ queryKey: ["waiter-orders-tables"] }),
        queryClient.invalidateQueries({ queryKey: ["waiter-table-today"] }),
        queryClient.invalidateQueries({ queryKey: ["waiter-order"] }),
        queryClient.invalidateQueries({ queryKey: ["waiter-open-bill"] }),
        queryClient.invalidateQueries({ queryKey: ["waiter-commissions-today"] }),
      ]);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: number) => cancelWaiterOrder(orderId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["waiter-orders-pending"] }),
        queryClient.invalidateQueries({ queryKey: ["waiter-orders-today"] }),
        queryClient.invalidateQueries({ queryKey: ["waiter-orders-tables"] }),
        queryClient.invalidateQueries({ queryKey: ["waiter-table-today"] }),
        queryClient.invalidateQueries({ queryKey: ["waiter-order"] }),
        queryClient.invalidateQueries({ queryKey: ["waiter-open-bill"] }),
        queryClient.invalidateQueries({ queryKey: ["waiter-commissions-today"] }),
      ]);
    },
  });

  const noteMutation = useMutation({
    mutationFn: (payload: { orderId: number; note: string }) =>
      updateWaiterOrderNote(payload.orderId, payload.note),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["waiter-orders-pending"] }),
        queryClient.invalidateQueries({ queryKey: ["waiter-orders-today"] }),
        queryClient.invalidateQueries({ queryKey: ["waiter-table-today"] }),
      ]);
    },
  });

  async function handleLogout() {
    await waiterLogout();
    router.replace(DASHBOARD_ROUTES.waiterLogin);
  }

  if (me === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (me === null) {
    return null;
  }

  if (createOrderOpen) {
    return (
      <div className="mx-auto w-full max-w-lg">
        <WaiterCreateOrderView
          initialTable={createOrderTable}
          onClose={() => {
            setCreateOrderOpen(false);
            setCreateOrderTable(null);
          }}
          onCreated={async (table) => {
            setCreateOrderOpen(false);
            setCreateOrderTable(null);
            setTab("tables");
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["waiter-orders-pending"] }),
              queryClient.invalidateQueries({ queryKey: ["waiter-orders-today"] }),
              queryClient.invalidateQueries({ queryKey: ["waiter-orders-tables"] }),
              queryClient.invalidateQueries({ queryKey: ["waiter-table-today"] }),
              queryClient.invalidateQueries({ queryKey: ["waiter-open-bill"] }),
              queryClient.invalidateQueries({ queryKey: ["waiter-commissions-today"] }),
            ]);
            if (table) {
              const tables = await queryClient.fetchQuery({
                queryKey: ["waiter-orders-tables"],
                queryFn: listWaiterTables,
              });
              setSelectedTable(tables.find((entry) => entry.tableId === table.tableId) ?? table);
            } else {
              setSelectedTable(null);
            }
          }}
        />
      </div>
    );
  }

  if (selectedOrderId != null) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background">
        <WaiterOrderDetail
          orderId={selectedOrderId}
          busy={cancelMutation.isPending}
          errorMessage={
            cancelMutation.isError
              ? cancelMutation.error instanceof WaiterApiError
                ? cancelMutation.error.message
                : "Sipariş iptal edilemedi."
              : null
          }
          onBack={() => setSelectedOrderId(null)}
          onCancel={() => cancelMutation.mutate(selectedOrderId)}
          onGoToCampaigns={() => {
            setSelectedOrderId(null);
            setTab("campaigns");
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">{me.displayName || "Garson"}</h1>
            <p className="text-xs text-muted-foreground">Sipariş Paneli</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setCreateOrderTable(tab === "tables" ? selectedTable : null);
                setCreateOrderOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Sipariş
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Çıkış
            </Button>
          </div>
        </div>
      </header>

      <nav className="grid grid-cols-5 gap-1 border-b border-border px-2 py-2">
        {(
          [
            { key: "pending" as const, label: "Bekleyen" },
            { key: "tables" as const, label: "Masalar" },
            { key: "today" as const, label: "Bugün" },
            { key: "commission" as const, label: "Komisyon" },
            { key: "campaigns" as const, label: "Kampanyalar" },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setTab(item.key);
              if (item.key !== "tables") setSelectedTable(null);
            }}
            className={`rounded-md px-2 py-2.5 text-sm font-medium transition-colors ${
              tab === item.key
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 space-y-3 px-4 py-4 pb-8">
        {actionMutation.isError || noteMutation.isError ? (
          <p className="text-sm text-destructive">
            {(actionMutation.error || noteMutation.error) instanceof WaiterApiError
              ? ((actionMutation.error || noteMutation.error) as WaiterApiError).message
              : "İşlem başarısız."}
          </p>
        ) : null}

        {tab === "pending" ? (
          pendingQuery.isLoading ? (
            <LoadingBlock />
          ) : (pendingQuery.data ?? []).length === 0 ? (
            <EmptyBlock text="Bekleyen sipariş yok." tone="teal" />
          ) : (
            (pendingQuery.data ?? []).map((order) => (
              <PendingOrderCard
                key={order.id}
                order={order}
                busy={actionMutation.isPending || noteMutation.isPending}
                onConfirm={(note) =>
                  actionMutation.mutate({ orderId: order.id, action: "confirm", note })
                }
                onReject={(note) =>
                  actionMutation.mutate({ orderId: order.id, action: "reject", note })
                }
                onSaveNote={(note) => noteMutation.mutate({ orderId: order.id, note })}
              />
            ))
          )
        ) : null}

        {tab === "tables" ? (
          selectedTable ? (
            <div className="space-y-3">
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
                onClick={() => setSelectedTable(null)}
              >
                <ArrowLeft className="h-4 w-4" />
                Masalar
              </button>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">
                  {selectedTable.tableName || `Masa ${selectedTable.tableNumber ?? ""}`}
                </h2>
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setCreateOrderTable(selectedTable);
                    setCreateOrderOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Sipariş
                </Button>
              </div>
              <WaiterBillDetailView
                table={selectedTable}
                onAddProducts={() => {
                  setCreateOrderTable(selectedTable);
                  setCreateOrderOpen(true);
                }}
                onClosed={() => {
                  void queryClient.invalidateQueries({ queryKey: ["waiter-orders-tables"] });
                  setSelectedTable(null);
                }}
              />
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Bugünkü siparişler</h3>
                {tableOrdersQuery.isLoading ? (
                  <LoadingBlock />
                ) : (tableOrdersQuery.data ?? []).length === 0 ? (
                  <EmptyBlock text="Bugün bu masada sipariş yok." />
                ) : (
                  (tableOrdersQuery.data ?? []).map((order) => (
                    <HistoryOrderCard
                      key={order.id}
                      order={order}
                      showCommission
                      onOpenDetail={() => setSelectedOrderId(order.id)}
                    />
                  ))
                )}
              </div>
            </div>
          ) : tablesQuery.isLoading ? (
            <LoadingBlock />
          ) : (tablesQuery.data ?? []).length === 0 ? (
            <EmptyBlock text="Masa bulunamadı." />
          ) : (
            (tablesQuery.data ?? []).map((table) => (
              <TableListCard
                key={table.tableId}
                table={table}
                onSelect={() => setSelectedTable(table)}
              />
            ))
          )
        ) : null}

        {tab === "today" ? (
          todayQuery.isLoading ? (
            <LoadingBlock />
          ) : (todayQuery.data ?? []).length === 0 ? (
            <EmptyBlock text="Bugün sipariş yok." />
          ) : (
            (todayQuery.data ?? []).map((order) => (
              <HistoryOrderCard
                key={order.id}
                order={order}
                showCommission
                onOpenDetail={() => setSelectedOrderId(order.id)}
              />
            ))
          )
        ) : null}

        {tab === "commission" ? <WaiterCommissionPanel /> : null}
        {tab === "campaigns" && me ? <WaiterCampaignPanel menuId={me.menuId} /> : null}
      </main>
    </div>
  );
}

function TableListCard({
  table,
  onSelect,
}: {
  table: WaiterTableSummary;
  onSelect: () => void;
}) {
  const tone = getTableCardTone(table);
  const amount =
    tone === "open" && table.openBillTotal != null
      ? formatMenuPrice(table.openBillTotal, "TRY")
      : tone === "pending" && table.latestPendingTotal != null
        ? formatMenuPrice(table.latestPendingTotal, "TRY")
        : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left shadow-sm transition-colors",
        tableCardToneClasses(tone),
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-semibold">
          {table.tableName || `Masa ${table.tableNumber ?? table.tableId}`}
        </p>
        <p className="text-xs text-white/85">{tableCardSubtitle(table, tone)}</p>
      </div>
      <div className="shrink-0 text-right">
        {amount ? <p className="text-sm font-semibold">{amount}</p> : null}
        <span className="mt-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
          {tableCardStatusLabel(tone)}
        </span>
      </div>
    </button>
  );
}

function LoadingBlock() {
  return (
    <div className="flex justify-center py-16 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

function EmptyBlock({ text, tone }: { text: string; tone?: "teal" }) {
  if (tone === "teal") {
    return (
      <div
        className="rounded-lg border border-dashed px-4 py-12 text-center text-sm"
        style={{
          borderColor: "hsl(var(--chart-teal) / 0.28)",
          backgroundImage:
            "linear-gradient(180deg, hsl(var(--chart-teal) / 0.32) 0%, hsl(var(--chart-teal) / 0.20) 32%, hsl(var(--chart-teal) / 0.08) 62%, hsl(var(--chart-teal) / 0) 100%)",
          color: "hsl(var(--chart-teal))",
        }}
      >
        {text}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function PendingOrderCard({
  order,
  busy,
  onConfirm,
  onReject,
  onSaveNote,
}: {
  order: OrderResponse;
  busy: boolean;
  onConfirm: (note: string) => void;
  onReject: (note: string) => void;
  onSaveNote: (note: string) => void;
}) {
  const [note, setNote] = useState(order.waiterNote || "");
  const [open, setOpen] = useState(false);
  const items = order.items ?? [];

  return (
    <article className="animate-waiter-pending-bounce overflow-hidden rounded-lg border border-orange-600 bg-orange-500 text-white shadow-sm">
      <div className="flex items-start gap-1 p-4">
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => setOpen((value) => !value)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">{order.tableName || "Masa"}</h2>
              <p className="text-sm text-white/85">
                #{order.id} · {formatWhen(order.submittedAt || order.createdAt)}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-white/90">
                Onay bekliyor
              </p>
            </div>
            <p className="shrink-0 text-base font-semibold">
              {formatMenuPrice(order.totalAmount ?? undefined, order.currency || "TRY")}
            </p>
          </div>
        </button>
        <button
          type="button"
          className="mt-0.5 rounded-md p-1 text-white/85 hover:bg-white/15 hover:text-white"
          aria-expanded={open}
          aria-label={open ? "Siparişi gizle" : "Siparişi göster"}
          onClick={() => setOpen((value) => !value)}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/20 px-4 pb-4">
          <ul className="space-y-1.5 pt-3">
            {items.map((item) => (
              <li key={`${order.id}-${item.id ?? item.productId}`} className="text-sm">
                <span className="font-medium">{item.quantity}×</span>{" "}
                {item.productName || `#${item.productId}`}
                {item.note ? (
                  <span className="block text-xs text-white/80">Not: {item.note}</span>
                ) : null}
              </li>
            ))}
          </ul>

          {order.note ? (
            <p className="mt-2 rounded-md bg-white/15 px-2 py-1.5 text-sm text-white/90">
              Sipariş notu: {order.note}
            </p>
          ) : null}

          <div className="mt-3 space-y-2">
            <label className="text-xs font-medium text-white/85" htmlFor={`note-${order.id}`}>
              Garson notu
            </label>
            <div className="flex gap-2">
              <Input
                id={`note-${order.id}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Not ekle…"
                className="border-white/25 bg-white/15 text-white placeholder:text-white/60"
              />
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={() => onSaveNote(note)}
              >
                Kaydet
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="lg"
              className="h-12 border-white/20 bg-white text-base text-orange-600 hover:bg-white/90"
              disabled={busy}
              onClick={() => onConfirm(note)}
            >
              Onayla
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="h-12 border-white/30 bg-transparent text-base text-white hover:bg-white/15 hover:text-white"
              disabled={busy}
              onClick={() => onReject(note)}
            >
              Reddet
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function HistoryOrderCard({
  order,
  showCommission,
  onOpenDetail,
}: {
  order: OrderResponse;
  showCommission?: boolean;
  onOpenDetail: () => void;
}) {
  const [open, setOpen] = useState(false);
  const items = order.items ?? [];

  return (
    <article className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-start gap-1 p-4">
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onOpenDetail}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-semibold">{order.tableName || "Masa"}</h2>
              <p className="text-sm text-muted-foreground">
                #{order.id} · {formatWhen(order.submittedAt || order.createdAt)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {statusLabel(order.status)}
                {order.waiterName ? ` · ${order.waiterName}` : ""}
              </p>
              {showCommission && order.commissionAmount != null ? (
                <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Komisyon: {formatMenuPrice(order.commissionAmount, order.currency || "TRY")}
                </p>
              ) : null}
            </div>
            <p className="shrink-0 text-sm font-semibold">
              {formatMenuPrice(order.totalAmount ?? undefined, order.currency || "TRY")}
            </p>
          </div>
        </button>
        <button
          type="button"
          className="mt-0.5 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-expanded={open}
          aria-label={open ? "Ürünleri gizle" : "Ürünleri göster"}
          onClick={() => setOpen((value) => !value)}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open ? (
        <ul className="space-y-1 border-t border-border px-4 py-3">
          {items.length === 0 ? (
            <li className="text-sm text-muted-foreground">Ürün yok.</li>
          ) : (
            items.map((item) => (
              <li key={`${order.id}-${item.id ?? item.productId}`} className="text-sm">
                <span className="font-medium">{item.quantity}×</span>{" "}
                {item.productName || `#${item.productId}`}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </article>
  );
}

function formatDetailWhen(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function WaiterOrderDetail({
  orderId,
  busy,
  errorMessage,
  onBack,
  onCancel,
  onGoToCampaigns,
}: {
  orderId: number;
  busy: boolean;
  errorMessage?: string | null;
  onBack: () => void;
  onCancel: () => void;
  onGoToCampaigns?: () => void;
}) {
  const detailQuery = useQuery({
    queryKey: ["waiter-order", orderId],
    queryFn: () => getWaiterOrder(orderId),
  });
  const order = detailQuery.data;
  const canCancel = order?.status === "CONFIRMED" || order?.status === "SUBMITTED";

  return (
    <>
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          type="button"
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onBack}
          aria-label="Geri"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base font-semibold">Sipariş #{orderId}</h1>
          <p className="text-xs text-muted-foreground">{order?.tableName || "Masa"}</p>
        </div>
      </header>
      <main className="flex-1 space-y-3 px-4 py-4 pb-8">
        {detailQuery.isLoading ? <LoadingBlock /> : null}
        {detailQuery.isError ? (
          <p className="text-sm text-destructive">Sipariş yüklenemedi.</p>
        ) : null}
        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        {order ? (
          <>
            <section className="space-y-2 rounded-lg border border-border bg-card p-4 text-sm">
              <DetailRow label="Durum" value={statusLabel(order.status)} />
              <DetailRow label="Masa" value={order.tableName || "—"} />
              <DetailRow label="Siparişi veren" value={order.customerName || "Kayıtlı müşteri yok"} />
              {order.customerEmail ? <DetailRow label="E-posta" value={order.customerEmail} /> : null}
              <DetailRow label="Garson" value={order.waiterName || "—"} />
              <DetailRow label="Oluşturulma" value={formatDetailWhen(order.createdAt)} />
              <DetailRow label="Gönderilme" value={formatDetailWhen(order.submittedAt)} />
              <DetailRow label="Onay" value={formatDetailWhen(order.confirmedAt)} />
              {order.rejectedAt ? (
                <DetailRow
                  label={order.status === "CANCELLED" ? "İptal" : "Red"}
                  value={formatDetailWhen(order.rejectedAt)}
                />
              ) : null}
              {order.note ? <DetailRow label="Müşteri notu" value={order.note} /> : null}
              {order.waiterNote ? <DetailRow label="Garson notu" value={order.waiterNote} /> : null}
              {order.commissionAmount != null ? (
                <DetailRow
                  label="Komisyon"
                  value={formatMenuPrice(order.commissionAmount, order.currency || "TRY")}
                />
              ) : null}
            </section>

            {order.campaignSummary &&
            (order.campaignSummary.guestOrder ||
              (order.campaignSummary.campaignProductCount ?? 0) > 0 ||
              order.campaignSummary.hint) ? (
              <section className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                <h2 className="font-medium text-amber-900 dark:text-amber-100">Kampanya</h2>
                {order.campaignSummary.guestOrder ? (
                  <p className="text-muted-foreground">
                    Kayıtlı müşteri yok · Ödül bekliyor olabilir.
                  </p>
                ) : null}
                {(order.campaignSummary.campaignProductCount ?? 0) > 0 ? (
                  <p>
                    Kampanyalı ürün: {order.campaignSummary.campaignProductCount} adet
                  </p>
                ) : null}
                {order.campaignSummary.hint ? (
                  <p className="text-xs text-muted-foreground">{order.campaignSummary.hint}</p>
                ) : null}
                {onGoToCampaigns ? (
                  <Button type="button" variant="outline" size="sm" onClick={onGoToCampaigns}>
                    Kampanya sekmesine git
                  </Button>
                ) : null}
              </section>
            ) : null}

            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="mb-2 text-sm font-medium">Ürünler</h2>
              <ul className="space-y-2">
                {(order.items ?? []).map((item) => (
                  <li
                    key={`${order.id}-${item.id ?? item.productId}`}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <span>
                      <span className="font-medium">{item.quantity}×</span>{" "}
                      {item.productName || `#${item.productId}`}
                      {item.note ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">{item.note}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {formatMenuPrice(item.lineTotal ?? undefined, order.currency || "TRY")}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-border pt-3 text-right text-sm font-semibold">
                {formatMenuPrice(order.totalAmount ?? undefined, order.currency || "TRY")}
              </p>
            </section>
            {canCancel ? (
              <Button
                variant="destructive"
                className="w-full gap-2"
                disabled={busy}
                onClick={onCancel}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Siparişi iptal et
              </Button>
            ) : null}
          </>
        ) : null}
      </main>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right font-medium">{value}</span>
    </div>
  );
}
