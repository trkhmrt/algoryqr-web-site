"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  buildSmartReportMarkdown,
  getSmartReportJobRequest,
  isSmartReportPending,
  normalizeSmartReportResult,
  SMART_REPORT_POLL_INTERVAL_MS,
  type SmartReportDetailResponse,
} from "@/lib/smart-report";
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
  const { toast } = useToast();
  const [pdfLoading, setPdfLoading] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["smart-reports", "detail", jobId],
    queryFn: () => getSmartReportJobRequest(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return isSmartReportPending(status) ? SMART_REPORT_POLL_INTERVAL_MS : false;
    },
  });

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
        title: result.title || detail?.menuName || "Akilli Rapor",
        markdown,
        fileName: `akilli-rapor-${detail?.menuId ?? "menu"}-${detail?.from ?? ""}-${detail?.to ?? ""}.pdf`,
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
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href={DASHBOARD_ROUTES.smartReports}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
            {result?.title || detail?.menuName || "Akilli rapor"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {detail
              ? `${detail.menuName} · ${detail.from} – ${detail.to}`
              : "Rapor detayi"}
          </p>
        </div>
        {result && markdown && !pending ? (
          <Button onClick={() => void handleDownloadPdf()} disabled={pdfLoading}>
            {pdfLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            PDF indir
          </Button>
        ) : null}
      </div>

      {detailQuery.isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : detailQuery.isError ? (
        <p className="text-sm text-destructive">Rapor yuklenemedi.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm sm:grid-cols-3">
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
              className="rounded-lg border border-border bg-card p-4 text-sm text-foreground [&_h1]:mb-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_li]:mb-1 [&_p]:mb-2 [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
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
