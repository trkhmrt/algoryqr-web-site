"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock, FileText, RefreshCw } from "lucide-react";

import { useRequireScope } from "@/components/auth/RequireScope";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { DASHBOARD_BACK, DASHBOARD_SURFACE } from "@/lib/dashboard-surface";
import {
  getSmartReportQuotaRequest,
  isSmartReportCompleted,
  isSmartReportQuotaExhausted,
  listSmartReportsRequest,
  resolveSmartReportProcessId,
  smartReportTitle,
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
    <div className={`${DASHBOARD_SURFACE} px-3 py-3`}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
      <div className="space-y-6 animate-fade-in">
        <DashboardPageHeader
          title="Akıllı raporlar"
          hint="Oluşturduğunuz raporların geçmişi"
          back={
            <Link href={DASHBOARD_ROUTES.reportsHub} aria-label="Raporlara dön" className={DASHBOARD_BACK}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          }
        />
        <DashboardLoadingState label="Akıllı raporlar yükleniyor…" />
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
    <div className="space-y-6 animate-fade-in">
      <DashboardPageHeader
        title="Akıllı raporlar"
        hint="Oluşturduğunuz raporların geçmişi"
        back={
          <Link href={DASHBOARD_ROUTES.reportsHub} aria-label="Raporlara dön" className={DASHBOARD_BACK}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

      {quota ? <QuotaCountdownCard quota={quota} lastUsedAt={lastUsedAt} /> : null}

      {listQuery.isLoading ? (
        <DashboardLoadingState label="Rapor listesi yükleniyor…" />
      ) : listQuery.isError ? (
        <p className="text-sm text-destructive">Rapor listesi yüklenemedi.</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="Henüz akıllı rapor yok"
          description="Analitik sayfasından ilk akıllı raporunuzu oluşturabilirsiniz."
          action={
            <Link
              href={DASHBOARD_ROUTES.analytics}
              className="text-sm font-medium text-primary hover:underline"
            >
              Raporlardan akıllı rapor oluştur
            </Link>
          }
        />
      ) : (
        <div className={`${DASHBOARD_SURFACE} overflow-hidden divide-y divide-border`}>
          {items.map((item) => {
            const id = resolveSmartReportProcessId(item);
            if (!id) return null;
            return (
              <Link
                key={id}
                href={DASHBOARD_ROUTES.smartReportDetail(id)}
                className="flex items-center justify-between gap-3 bg-white px-3 py-2.5 transition-colors hover:bg-muted/50 dark:bg-card"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{smartReportTitle(item)}</p>
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
