"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { formatMenuPrice } from "@/components/menu-templates/types";
import { Input } from "@/components/ui/input";
import {
  getWaiterCommissionHistory,
  getWaiterTodayCommission,
  WaiterApiError,
  type WaiterCommissionRecord,
} from "@/lib/waiter-api";

function formatWhen(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function commissionTypeLabel(type?: WaiterCommissionRecord["recordType"]): string {
  switch (type) {
    case "PERCENT_ORDER":
      return "Sipariş komisyonu";
    case "FIXED_TABLE_CLOSE":
      return "Masa kapanış komisyonu";
    case "FIXED_ITEM_ADD":
      return "Ürün ekleme komisyonu";
    default:
      return "Komisyon";
  }
}

function CommissionRecordRow({ record }: { record: WaiterCommissionRecord }) {
  return (
    <article className="rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{commissionTypeLabel(record.recordType)}</p>
          <p className="text-xs text-muted-foreground">
            {record.tableName || "Masa"} · {formatWhen(record.createdAt)}
          </p>
        </div>
        <p className="shrink-0 text-sm font-semibold tabular-nums">
          {formatMenuPrice(record.amount ?? undefined, record.currency || "TRY")}
        </p>
      </div>
    </article>
  );
}

export default function WaiterCommissionPanel() {
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");

  const todayQuery = useQuery({
    queryKey: ["waiter-commissions-today"],
    queryFn: getWaiterTodayCommission,
    refetchInterval: 15_000,
  });

  const historyQuery = useQuery({
    queryKey: ["waiter-commissions-history", historyFrom, historyTo],
    queryFn: () =>
      getWaiterCommissionHistory({
        from: historyFrom || undefined,
        to: historyTo || undefined,
        page: 0,
        size: 30,
      }),
  });

  const today = todayQuery.data;
  const currency = today?.currency || "TRY";

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Bugünkü komisyon</h2>
        {todayQuery.isLoading ? (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : todayQuery.isError ? (
          <p className="mt-2 text-sm text-destructive">
            {todayQuery.error instanceof WaiterApiError
              ? todayQuery.error.message
              : "Komisyon özeti alınamadı."}
          </p>
        ) : (
          <>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {formatMenuPrice(today?.totalAmount ?? undefined, currency)}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <div className="rounded-md bg-muted/40 px-2 py-1.5">
                Sipariş (%):{" "}
                <span className="font-medium text-foreground">
                  {formatMenuPrice(today?.percentOrderTotal ?? undefined, currency)}
                </span>
              </div>
              <div className="rounded-md bg-muted/40 px-2 py-1.5">
                Ürün ekleme:{" "}
                <span className="font-medium text-foreground">
                  {formatMenuPrice(today?.fixedItemAddTotal ?? undefined, currency)}
                </span>
              </div>
              <div className="rounded-md bg-muted/40 px-2 py-1.5">
                Masa kapanışı:{" "}
                <span className="font-medium text-foreground">
                  {formatMenuPrice(today?.fixedTableCloseTotal ?? undefined, currency)}
                </span>
              </div>
            </div>
            {(today?.records ?? []).length > 0 ? (
              <ul className="mt-3 space-y-2">
                {(today?.records ?? []).slice(0, 5).map((record) => (
                  <li key={record.id}>
                    <CommissionRecordRow record={record} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Bugün komisyon kaydı yok.</p>
            )}
          </>
        )}
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Komisyon geçmişi</h2>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            value={historyFrom}
            onChange={(e) => setHistoryFrom(e.target.value)}
            aria-label="Başlangıç tarihi"
          />
          <Input
            type="date"
            value={historyTo}
            onChange={(e) => setHistoryTo(e.target.value)}
            aria-label="Bitiş tarihi"
          />
        </div>
        {historyQuery.isLoading ? (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : historyQuery.isError ? (
          <p className="text-sm text-destructive">
            {historyQuery.error instanceof WaiterApiError
              ? historyQuery.error.message
              : "Geçmiş alınamadı."}
          </p>
        ) : (historyQuery.data?.records ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Seçilen aralıkta kayıt yok.</p>
        ) : (
          <ul className="space-y-2">
            {(historyQuery.data?.records ?? []).map((record) => (
              <li key={record.id}>
                <CommissionRecordRow record={record} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
