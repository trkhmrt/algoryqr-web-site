"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock, FileText, Loader2, RefreshCw } from "lucide-react";

import { useRequireScope } from "@/components/auth/RequireScope";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getSmartReportQuotaRequest,
  isSmartReportCompleted,
  isSmartReportQuotaExhausted,
  listSmartReportsRequest,
  resolveSmartReportProcessId,
  type SmartReportQuota,
} from "@/lib/smart-report";

function formatDateTime(value: string): string {
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

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSec / 86_400);
  const hours = Math.floor((totalSec % 86_400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (days > 0) {
    return `${days}g ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function QuotaCountdownCard({
  quota,
  lastUsedAt,
}: {
  quota: SmartReportQuota;
  lastUsedAt: string | null;
}) {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => Date.now());
  const resetsAtMs = new Date(quota.resetsAt).getTime();
  const remainingMs = Number.isFinite(resetsAtMs) ? resetsAtMs - now : 0;
  const exhausted = isSmartReportQuotaExhausted(quota);
  const countdownDone = remainingMs <= 0;

  useEffect(() => {
    if (!exhausted || !Number.isFinite(resetsAtMs)) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [exhausted, resetsAtMs]);

  useEffect(() => {
    if (!exhausted || !countdownDone) return;
    void queryClient.invalidateQueries({ queryKey: ["smart-reports", "quota"] });
  }, [countdownDone, exhausted, queryClient]);

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Son kullanım
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {lastUsedAt ? formatDateTime(lastUsedAt) : "Henüz yok"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {exhausted ? "Yenilenmeye" : "Kalan hak"}
            </p>
            {exhausted ? (
              <p className="mt-0.5 font-mono text-sm font-semibold tracking-tight text-foreground tabular-nums">
                {countdownDone ? "Yenileniyor…" : formatCountdown(remainingMs)}
              </p>
            ) : (
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {quota.remaining}/{quota.limit} hazır
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SmartReportsView() {
  const { allowed, isLoading: accessLoading } = useRequireScope("SMART_REPORTING_OWNER");
  const listQuery = useQuery({
    queryKey: ["smart-reports", "list", "completed"],
    queryFn: () => listSmartReportsRequest({ page: 0, size: 50, status: "completed" }),
    enabled: allowed,
  });
  const quotaQuery = useQuery({
    queryKey: ["smart-reports", "quota"],
    queryFn: getSmartReportQuotaRequest,
    enabled: allowed,
  });

  if (accessLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  const items = (listQuery.data?.content ?? []).filter((item) =>
    isSmartReportCompleted(item.status ?? "completed"),
  );
  const quota = quotaQuery.data;
  const lastUsedAt =
    quota?.lastUsage ??
    items[0]?.completedAt ??
    items[0]?.createdAt ??
    null;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href={DASHBOARD_ROUTES.analytics}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Akilli raporlar
          </h1>
          <p className="text-sm text-muted-foreground">
            Olusturdugunuz raporlarin gecmisi
          </p>
        </div>
      </div>

      {quota ? <QuotaCountdownCard quota={quota} lastUsedAt={lastUsedAt} /> : null}

      {listQuery.isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : listQuery.isError ? (
        <p className="text-sm text-destructive">Rapor listesi yuklenemedi.</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
          <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Henuz akilli rapor yok.</p>
          <Link
            href={DASHBOARD_ROUTES.analytics}
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            Raporlardan akıllı rapor oluştur
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
          {items.map((item) => {
            const id = resolveSmartReportProcessId(item);
            if (!id) return null;
            return (
              <Link
                key={id}
                href={DASHBOARD_ROUTES.smartReportDetail(id)}
                className="flex items-center justify-between gap-3 bg-card px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{item.menuName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(item.completedAt ?? item.createdAt)}
                  </p>
                </div>
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
