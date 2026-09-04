"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, Clock, Loader2 } from "lucide-react";

import { DigitalMenuHubGate } from "@/components/dashboard/digital-menu/DigitalMenuHubGate";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { useListQueryState } from "@/hooks/use-list-query-state";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { DASHBOARD_STAT_TILE, DASHBOARD_TYPE_KPI } from "@/lib/dashboard-surface";
import {
  DigitalMenuPicker,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { Input } from "@/components/ui/input";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import {
  ApiError,
  getMenuReservationsRequest,
  updateMenuReservationRequest,
  type MenuReservationApiItem,
  type MenuReservationStatus,
} from "@/lib/api";

type StatusFilter = MenuReservationStatus | "all";

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toLocalInputValue(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInputValue(value: string): string {
  return value.length === 16 ? `${value}:00` : value;
}

function statusLabel(status: MenuReservationStatus): string {
  switch (status) {
    case "PENDING":
      return "Onay bekliyor";
    case "ACTIVE":
      return "Aktif";
    case "CANCELED":
      return "İptal";
    default:
      return status;
  }
}

function statusClass(status: MenuReservationStatus): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-500/15 text-amber-700";
    case "ACTIVE":
      return "bg-emerald-500/15 text-emerald-700";
    case "CANCELED":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function ReservationsPanel() {
  const searchParams = useSearchParams();
  const qrFromQuery = Number(searchParams.get("qr"));
  const initialQrId = Number.isFinite(qrFromQuery) && qrFromQuery > 0 ? qrFromQuery : null;
  const { notify } = useDashboardBanners();
  const queryClient = useQueryClient();

  const { menuQrs, selection, loading, error, selectQrId } = useDigitalMenuSelection(initialQrId);
  const { setQuery } = useListQueryState();

  const [status, setStatus] = useState<StatusFilter>(
    () => (searchParams.get("status") as StatusFilter) || "all",
  );
  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [range, setRange] = useState(() => ({
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
  }));
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const menuId = selection?.menu.menuId ?? null;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [q]);

  const listQuery = useQuery({
    queryKey: ["menu-reservations", menuId, status, debouncedQ, range.from, range.to, page],
    enabled: menuId != null,
    queryFn: () =>
      getMenuReservationsRequest(menuId!, {
        status,
        q: debouncedQ || undefined,
        from: range.from || undefined,
        to: range.to || undefined,
        page,
        size: 20,
      }),
  });

  const mutation = useMutation({
    mutationFn: async (payload: {
      reservationId: number;
      status?: MenuReservationStatus;
      reservationAt?: string;
    }) =>
      updateMenuReservationRequest(menuId!, payload.reservationId, {
        status: payload.status,
        reservationAt: payload.reservationAt,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["menu-reservations", menuId] });
      setEditingId(null);
      notify("info", "Rezervasyon güncellendi.");
    },
    onError: (err) => {
      notify("danger", err instanceof ApiError ? err.message : "Güncelleme başarısız.");
    },
  });

  const items = listQuery.data?.content ?? [];
  const totalPages = listQuery.data?.totalPages ?? 0;

  const counts = useMemo(() => {
    const pending = items.filter((i) => i.status === "PENDING").length;
    const active = items.filter((i) => i.status === "ACTIVE").length;
    const canceled = items.filter((i) => i.status === "CANCELED").length;
    return {
      pending,
      active,
      canceled,
      page: items.length,
      total: listQuery.data?.totalElements ?? items.length,
    };
  }, [items, listQuery.data?.totalElements]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const renderActions = (item: MenuReservationApiItem) => {
    const busy = mutation.isPending;
    return (
      <div className="flex flex-wrap gap-2">
        {item.status === "PENDING" ? (
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              mutation.mutate({ reservationId: item.id, status: "ACTIVE" })
            }
          >
            Onayla
          </Button>
        ) : null}
        {item.status !== "CANCELED" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() =>
              mutation.mutate({ reservationId: item.id, status: "CANCELED" })
            }
          >
            İptal et
          </Button>
        ) : null}
        {item.status !== "CANCELED" ? (
          editingId === item.id ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="datetime-local"
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />
              <Button
                size="sm"
                disabled={busy || !editValue}
                onClick={() =>
                  mutation.mutate({
                    reservationId: item.id,
                    reservationAt: fromLocalInputValue(editValue),
                  })
                }
              >
                Kaydet
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => setEditingId(null)}
              >
                Vazgeç
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setEditingId(item.id);
                setEditValue(toLocalInputValue(item.reservationAt));
              }}
            >
              Tarih/saat düzenle
            </Button>
          )
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardPageHeader
        title="Rezervasyonlar"
        hint="Onay bekleyen ve aktif rezervasyonları yönetin."
        action={
          <DigitalMenuPicker
            compact
            menuQrs={menuQrs}
            selectedQrId={selection?.qr.id ?? null}
            onSelectQrId={(qrId) => {
              setPage(0);
              void selectQrId(qrId);
            }}
          />
        }
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {menuQrs.length === 0 ? (
        <EmptyState
          title="Menü gerekli"
          description="Rezervasyonları görmek için önce bir dijital menü yayınlayın."
          action={
            <Button asChild variant="outline">
              <Link href={DASHBOARD_ROUTES.digitalMenu}>Menü oluştur</Link>
            </Button>
          }
        />
      ) : menuId == null ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Menü bilgisi yükleniyor…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setStatus("all");
                setPage(0);
              }}
              className={DASHBOARD_STAT_TILE}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                  <CalendarDays className="h-3.5 w-3.5" style={{ color: "hsl(var(--chart-indigo))" }} />
                </div>
                <p className="text-xs text-muted-foreground">Toplam</p>
              </div>
              <p className={`mt-2 tabular-nums ${DASHBOARD_TYPE_KPI}`}>
                {counts.total}
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus("PENDING");
                setPage(0);
              }}
              className={DASHBOARD_STAT_TILE}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                  <Clock className="h-3.5 w-3.5" style={{ color: "hsl(var(--chart-orange))" }} />
                </div>
                <p className="text-xs text-muted-foreground">Bekleyen</p>
              </div>
              <p className={`mt-2 tabular-nums ${DASHBOARD_TYPE_KPI}`}>
                {counts.pending}
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus("ACTIVE");
                setPage(0);
              }}
              className={DASHBOARD_STAT_TILE}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                  <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "hsl(var(--chart-green))" }} />
                </div>
                <p className="text-xs text-muted-foreground">Aktif</p>
              </div>
              <p className={`mt-2 tabular-nums ${DASHBOARD_TYPE_KPI}`}>
                {counts.active}
              </p>
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
              {counts.page === 0 ? null : (
                <>
                  <div
                    className="h-full"
                    style={{
                      width: `${(counts.pending / counts.page) * 100}%`,
                      backgroundColor: "hsl(var(--chart-orange))",
                    }}
                  />
                  <div
                    className="h-full"
                    style={{
                      width: `${(counts.active / counts.page) * 100}%`,
                      backgroundColor: "hsl(var(--chart-green))",
                    }}
                  />
                  <div
                    className="h-full"
                    style={{
                      width: `${(counts.canceled / counts.page) * 100}%`,
                      backgroundColor: "hsl(var(--chart-red))",
                    }}
                  />
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Bu listedeki dağılım · {counts.pending} bekleyen · {counts.active} aktif
              {counts.canceled > 0 ? ` · ${counts.canceled} iptal` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <FilterSelect
              className="w-[12rem]"
              label="Durum"
              value={status}
              onValueChange={(next) => {
                const value = next as StatusFilter;
                setStatus(value);
                setPage(0);
                setQuery({ status: value === "all" ? null : value });
              }}
              options={[
                { value: "all", label: "Tümü" },
                { value: "PENDING", label: "Onay bekliyor" },
                { value: "ACTIVE", label: "Aktif" },
                { value: "CANCELED", label: "İptal" },
              ]}
            />
            <DateRangeFilter
              className="min-w-0 flex-1"
              value={range}
              onChange={(next) => {
                setRange(next);
                setPage(0);
                setQuery({ from: next.from || null, to: next.to || null });
              }}
            />
            <div className="min-w-[200px] flex-1 space-y-1.5">
              <label className="text-xs text-muted-foreground">Ara (ad / e-posta)</label>
              <Input
                value={q}
                placeholder="Müşteri adı veya e-posta"
                onChange={(e) => {
                  const next = e.target.value;
                  setQ(next);
                  setPage(0);
                  setQuery({ q: next.trim() || null });
                }}
              />
            </div>
          </div>

          {listQuery.isLoading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Rezervasyonlar yükleniyor…
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title={status !== "all" || q.trim() || range.from || range.to ? "Filtrelere uyan rezervasyon yok" : "Henüz rezervasyon yok"}
              description={
                status !== "all" || q.trim() || range.from || range.to
                  ? "Durum, tarih veya arama filtresini temizleyip tekrar deneyin."
                  : "Müşteriler rezervasyon yaptığında burada görünür."
              }
              action={
                status !== "all" || q.trim() || range.from || range.to ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatus("all");
                      setQ("");
                      setRange({ from: "", to: "" });
                      setPage(0);
                      setQuery({ status: null, q: null, from: null, to: null });
                    }}
                  >
                    Filtreleri temizle
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{item.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.phone || "—"} · {item.email || "—"}
                        </p>
                      </div>
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${statusClass(item.status)}`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>Zaman: {formatDateTime(item.reservationAt)}</p>
                      <p>Kişi: {item.partySize}</p>
                      {item.note ? <p className="sm:col-span-2">Not: {item.note}</p> : null}
                    </div>
                    {renderActions(item)}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 0 || listQuery.isFetching}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Önceki
              </Button>
              <p className="text-xs text-muted-foreground">
                Sayfa {page + 1} / {totalPages}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={!listQuery.data?.hasNext || listQuery.isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Sonraki
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function ReservationsView() {
  return (
    <DigitalMenuHubGate>
      <ReservationsPanel />
    </DigitalMenuHubGate>
  );
}
