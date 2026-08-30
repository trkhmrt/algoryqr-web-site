"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { useState } from "react";

import { useRequireScope } from "@/components/auth/RequireScope";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  buildSmartReportMarkdown,
  getSmartReportJobRequest,
  isSmartReportPending,
  normalizeSmartReportResult,
  SMART_REPORT_POLL_INTERVAL_MS,
  smartReportTitle,
  type SmartReportDetailResponse,
} from "@/lib/smart-report";
import { DASHBOARD_BACK, DASHBOARD_SURFACE } from "@/lib/dashboard-surface";
import {
  downloadSmartReportPdf,
  smartReportMarkdownToHtml,
} from "@/lib/smart-report-pdf";

type Props = {
  jobId: string;
};

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

function statusLabel(status?: string | null): string {
  switch (status) {
    case "queued":
      return "Kuyrukta";
    case "processing":
    case "running":
      return "Hazirlaniyor";
    case "completed":
      return "Hazir";
    case "failed":
      return "Basarisiz";
    default:
      return status || "—";
  }
}

export default function SmartReportDetailView({ jobId }: Props) {
  const { allowed, isLoading: accessLoading } = useRequireScope("SMART_REPORTING_OWNER");
  const { toast } = useToast();
  const [pdfLoading, setPdfLoading] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["smart-reports", "detail", jobId],
    queryFn: () => getSmartReportJobRequest(jobId),
    enabled: allowed,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return isSmartReportPending(status) ? SMART_REPORT_POLL_INTERVAL_MS : false;
    },
  });

  if (accessLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <DashboardPageHeader
          title="Akıllı rapor"
          hint="Rapor detayı yükleniyor"
          back={
            <Link href={DASHBOARD_ROUTES.smartReports} aria-label="Raporlara dön" className={DASHBOARD_BACK}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          }
        />
        <DashboardLoadingState label="Rapor detayı hazırlanıyor…" />
      </div>
    );
  }

  const detail = detailQuery.data as SmartReportDetailResponse | undefined;
  const result = normalizeSmartReportResult(detail);
  const pending = isSmartReportPending(detail?.status);
  const markdown = result ? buildSmartReportMarkdown(result) : "";
  const bodyHtml = markdown
    ? smartReportMarkdownToHtml(markdown, { inlineStyles: false })
    : "";

  async function handleDownloadPdf() {
    if (!result || !markdown) return;
    setPdfLoading(true);
    try {
      await downloadSmartReportPdf({
        title: result.title || (detail ? smartReportTitle(detail) : "Akilli Rapor"),
        markdown,
        fileName: `akilli-rapor-${detail?.branchId ?? detail?.menuId ?? "rapor"}-${detail?.from ?? ""}-${detail?.to ?? ""}.pdf`,
      });
    } catch {
      toast({
        title: "PDF indirilemedi",
        description: "Lutfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardPageHeader
        title={result?.title || (detail ? smartReportTitle(detail) : "Akıllı rapor")}
        hint={
          detail
            ? `${smartReportTitle(detail)} · ${detail.from} – ${detail.to}`
            : "Rapor detayı"
        }
        back={
          <Link href={DASHBOARD_ROUTES.smartReports} aria-label="Raporlara dön" className={DASHBOARD_BACK}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
        action={
          result && markdown && !pending ? (
            <Button onClick={() => void handleDownloadPdf()} disabled={pdfLoading}>
              {pdfLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              PDF indir
            </Button>
          ) : null
        }
      />

      {detailQuery.isLoading ? (
        <DashboardLoadingState label="Rapor yükleniyor…" />
      ) : detailQuery.isError ? (
        <p className="text-sm text-destructive">Rapor yuklenemedi.</p>
      ) : (
        <div className="space-y-4">
          <div className={`${DASHBOARD_SURFACE} grid gap-2 px-3 py-2.5 text-sm sm:grid-cols-3`}>
            <div>
              <p className="text-xs text-muted-foreground">Durum</p>
              <p className="font-medium text-foreground">{statusLabel(detail?.status)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Istek</p>
              <p className="font-medium text-foreground">
                {formatDateTime(detail?.requestedAt || detail?.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tamamlanma</p>
              <p className="font-medium text-foreground">{formatDateTime(detail?.completedAt)}</p>
            </div>
          </div>

          {pending ? (
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Rapor hazirlaniyor. Bu sayfa otomatik guncellenir.
            </div>
          ) : null}

          {detail?.status === "failed" ? (
            <p className="text-sm text-destructive">
              {detail.errorMessage || "Rapor olusturulamadi."}
            </p>
          ) : null}

          {bodyHtml ? (
            <div
              className={`${DASHBOARD_SURFACE} p-4 text-sm text-foreground [&_h1]:mb-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_li]:mb-1 [&_p]:mb-2 [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5`}
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          ) : result && !pending ? (
            <p className="text-sm text-muted-foreground">Rapor icerigi bulunamadi.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
