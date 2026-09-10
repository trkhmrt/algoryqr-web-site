"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

import { RequireScope } from "@/components/auth/RequireScope";
import { BranchReportPicker, useBranchReportSelection } from "@/components/dashboard/BranchReportPicker";
import BranchSmartReportStory from "@/components/dashboard/BranchSmartReportStory";
import BranchReportDashboard from "@/components/dashboard/smart-report/BranchReportDashboard";
import AnalyticsVisitsPanel from "@/components/dashboard/AnalyticsVisitsPanel";
import AnalyticsWaiterPerformancePanel from "@/components/dashboard/AnalyticsWaiterPerformancePanel";
import { SmartFeaturePanel } from "@/components/dashboard/SmartFeaturePanel";
import { SearchableSelect } from "@/components/dashboard/menu/SearchableSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useBranchAnalyticsReport } from "@/hooks/use-branch-analytics-report";
import { useBranchRevenueReport } from "@/hooks/use-branch-revenue-report";
import { useBranchWaiterPerformanceReport } from "@/hooks/use-branch-waiter-performance-report";
import { useSmartReportJob } from "@/hooks/use-smart-report-job";
import { useAccessProfile } from "@/hooks/use-access-profile";
import { useToast } from "@/hooks/use-toast";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { hasScope } from "@/lib/auth-user";
import { PRODUCT_HINTS } from "@/lib/product-hints";
import { SlidingTabSelect } from "@/components/ui/sliding-tab-select";
import { downloadSmartReportPdf } from "@/lib/smart-report-pdf";
import {
  getSmartReportQuotaRequest,
  buildChannelComparisonHtml,
  buildSmartReportMarkdown,
  isSmartReportQuotaExhausted,
  normalizeSmartReportResult,
  smartReportAddonCheckoutCode,
} from "@/lib/smart-report";
import { getBranchRevenueReportRequest } from "@/lib/api";
import {
  reportingPeriodRange,
  type AnalyticsPeriod,
} from "@/reporting";

function useTooltipStyle() {
  if (typeof document === "undefined") {
    return {
      backgroundColor: "hsl(0 0% 100%)",
      border: "1px solid hsl(0 0% 88%)",
      borderRadius: "8px",
      fontSize: "12px",
      color: "hsl(0 0% 10%)",
      boxShadow: "0 2px 8px hsl(0 0% 0% / 0.08)",
    };
  }
  const isDark = document.documentElement.classList.contains("dark");
  return {
    backgroundColor: isDark ? "hsl(0 0% 8%)" : "hsl(0 0% 100%)",
    border: isDark ? "1px solid hsl(0 0% 15%)" : "1px solid hsl(0 0% 88%)",
    borderRadius: "8px",
    fontSize: "12px",
    color: isDark ? "hsl(0 0% 93%)" : "hsl(0 0% 10%)",
    boxShadow: isDark ? "none" : "0 2px 8px hsl(0 0% 0% / 0.08)",
  };
}

type ReportView = "visits" | "revenue" | "personnel";

export default function AnalyticsTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBranchId = useMemo(() => {
    const raw = Number(searchParams.get("branch"));
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
  }, [searchParams]);
  const initialQrId = useMemo(() => {
    const raw = Number(searchParams.get("qr"));
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
  }, [searchParams]);
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const [reportView, setReportView] = useState<ReportView>("visits");
  const activeReportView: ReportView = reportView;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [draftBranchId, setDraftBranchId] = useState<number | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const tooltipStyle = useTooltipStyle();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: accessProfile, isLoading: accessProfileLoading } = useAccessProfile();
  const canUseSmartReporting = hasScope(accessProfile, "SMART_REPORTING_OWNER");
  const canUseWaiterPanel = hasScope(accessProfile, "WAITER_PANEL_OWNER");
  const canUseRevenue = canUseSmartReporting || canUseWaiterPanel;
  const {
    branches,
    selection,
    branchId,
    qrId,
    menuId,
    loading: selectionLoading,
    empty: noBranches,
    select,
  } = useBranchReportSelection(initialBranchId, initialQrId);
  const range = useMemo(() => reportingPeriodRange(period), [period]);
  const reportQuery = useBranchAnalyticsReport(
    branchId,
    menuId,
    range.from,
    range.to,
    branchId != null,
  );
  const revenueQuery = useBranchRevenueReport(
    branchId,
    menuId,
    range.from,
    range.to,
    canUseRevenue &&
      branchId != null &&
      (activeReportView === "revenue" ||
        activeReportView === "visits" ||
        activeReportView === "personnel"),
  );
  const personnelQuery = useBranchWaiterPerformanceReport(
    branchId,
    menuId,
    range.from,
    range.to,
    canUseRevenue &&
      branchId != null &&
      (activeReportView === "personnel" || activeReportView === "revenue"),
  );
  const report = reportQuery.data;
  const smartReport = useSmartReportJob({
    branchId,
    menuId: null,
    from: range.from,
    to: range.to,
  });
  const quotaQuery = useQuery({
    queryKey: ["smart-reports", "quota"],
    queryFn: getSmartReportQuotaRequest,
    enabled: canUseSmartReporting,
  });
  const quota = quotaQuery.data;
  const quotaExhausted = isSmartReportQuotaExhausted(quota);
  const backHref =
    selection?.menu?.qrId != null
      ? DASHBOARD_ROUTES.digitalMenuEdit(selection.menu.qrId)
      : DASHBOARD_ROUTES.reportsHub;
  const result = normalizeSmartReportResult(smartReport.job);
  const failed = smartReport.isFailed;
  const wasGeneratingRef = useRef(false);

  useEffect(() => {
    if (smartReport.isGenerating) {
      wasGeneratingRef.current = true;
    }
  }, [smartReport.isGenerating]);

  useEffect(() => {
    if (!smartReport.isReady || !wasGeneratingRef.current) return;
    wasGeneratingRef.current = false;
    setDialogOpen(true);
    void queryClient.invalidateQueries({ queryKey: ["smart-reports", "list"] });
    void queryClient.invalidateQueries({ queryKey: ["smart-reports", "quota"] });
    toast({
      title: "Rapor indirmeye hazır",
      description: "Akıllı raporunuz hazır. PDF olarak indirebilirsiniz.",
    });
  }, [smartReport.isReady, toast, queryClient]);

  function handleSmartReportHistoryClick() {
    router.push(DASHBOARD_ROUTES.smartReports);
  }

  function openSmartReportConfirm() {
    if (branches.length === 0) {
      toast({
        title: "Şube bulunamadı",
        description: "Akıllı rapor için önce bir şube oluşturun.",
        variant: "destructive",
      });
      return;
    }
    setDraftBranchId(branchId ?? branches[0].id);
    setConfirmOpen(true);
  }

  function handleSmartReportClick() {
    if (smartReport.isReady) {
      setDialogOpen(true);
      return;
    }
    if (smartReport.isGenerating) {
      setDialogOpen(true);
      return;
    }
    if (quotaExhausted) {
      router.push(DASHBOARD_ROUTES.catalogProductCheckout(smartReportAddonCheckoutCode(quota)));
      return;
    }
    openSmartReportConfirm();
  }

  async function startSmartReport() {
    if (draftBranchId == null) return;
    if (!branches.some((item) => item.id === draftBranchId)) return;
    setConfirmOpen(false);
    select(draftBranchId, null);
    router.replace(
      DASHBOARD_ROUTES.digitalMenuAnalyticsForBranch(draftBranchId, null),
      { scroll: false },
    );
    try {
      const body = {
        branchId: draftBranchId,
        from: range.from,
        to: range.to,
        locale: "tr",
      };
      if (failed) {
        await smartReport.retry(body);
      } else {
        await smartReport.start(body);
      }
      await queryClient.invalidateQueries({ queryKey: ["smart-reports", "quota"] });
      await queryClient.invalidateQueries({ queryKey: ["smart-reports", "list"] });
      toast({
        title: "Rapor hazırlanıyor",
        description: "İşlem arka planda devam ediyor. Hazır olunca indirmeye açılacak.",
      });
      setDialogOpen(true);
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (status === 429
          ? "Ucretsiz hakkiniz bitti. Ek rapor icin satin alabilirsiniz."
          : "Akıllı rapor başlatılamadı.");
      toast({ title: "Hata", description: message, variant: "destructive" });
      if (status === 429) {
        await queryClient.invalidateQueries({ queryKey: ["smart-reports", "quota"] });
        router.push(DASHBOARD_ROUTES.catalogProductCheckout(smartReportAddonCheckoutCode(quota)));
      }
    }
  }

  async function handleDownloadPdf() {
    if (!result) return;
    setPdfLoading(true);
    try {
      const remoteUrl = smartReport.job?.pdfUrl?.trim();
      if (remoteUrl) {
        window.open(remoteUrl, "_blank", "noopener,noreferrer");
        return;
      }
      let prefixHtml = "";
      if (branchId != null) {
        try {
          const revenue = await getBranchRevenueReportRequest(
            branchId,
            range.from,
            range.to,
            null,
          );
          prefixHtml = buildChannelComparisonHtml(revenue.channels ?? []);
        } catch {
        }
      }
      const markdown = buildSmartReportMarkdown(result);
      await downloadSmartReportPdf({
        title: result.title || "Akilli Rapor",
        markdown,
        prefixHtml,
        fileName: `akilli-rapor-${branchId ?? "sube"}-${range.from}-${range.to}.pdf`,
      });
    } catch {
      toast({
        title: "PDF indirilemedi",
        description: "Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setPdfLoading(false);
    }
  }

  const visitLoading = selectionLoading || reportQuery.isLoading;
  const revenueLoading = selectionLoading || revenueQuery.isLoading;
  const personnelLoading = selectionLoading || personnelQuery.isLoading;
  const loading =
    activeReportView === "revenue"
      ? revenueLoading
      : activeReportView === "personnel"
        ? personnelLoading
        : visitLoading;
  const canGenerate = branches.length > 0 && !smartReport.isGenerating && !quotaExhausted;
  const canBuyExtraReport = quotaExhausted && !smartReport.isGenerating;
  const canConfirmSmartReport = draftBranchId != null;
  const smartReportLabel = smartReport.isReady
    ? "İndirmeye hazır"
    : smartReport.isGenerating
      ? "Hazırlanıyor…"
      : quotaExhausted
        ? "Ek rapor al (200 TL)"
        : failed
          ? "Tekrar dene"
          : "Akıllı Rapor";

  return (
    <div className="min-w-0 space-y-6 animate-fade-in">
      <div className="sticky top-0 z-10 flex flex-col gap-4 bg-background/95 py-1 backdrop-blur sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={backHref}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Raporlar
            </h1>
          </div>
        </div>
      </div>

      <RequireScope scope="SMART_REPORTING_OWNER">
          <SmartFeaturePanel
            title="Akıllı Rapor"
            hint={PRODUCT_HINTS.SMART_REPORTING}
            description="Yapay zeka destekli özet, içgörü ve PDF rapor oluşturun. Haftada 1 ücretsiz; ek rapor 200 TL."
            actionLabel={smartReportLabel}
            loading={smartReport.isGenerating}
            loadingSkeleton={accessProfileLoading}
            prominent
            disabled={
              accessProfileLoading ||
              (smartReport.isReady
                ? false
                : smartReport.isGenerating
                  ? true
                  : !(canGenerate || canBuyExtraReport))
            }
            onActionClick={() => handleSmartReportClick()}
            secondaryAction={{
              label: "Rapor geçmişi",
              onClick: handleSmartReportHistoryClick,
              disabled: accessProfileLoading,
            }}
          />
      </RequireScope>

      {canUseSmartReporting ? (
        <>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hangi şube için rapor oluşturulsun?</DialogTitle>
            <DialogDescription>
              {quota?.period === "WEEK"
                ? "Seçtiğiniz şube için akıllı rapor hazırlanır. Haftada 1 ücretsiz hakkınız varsa o düşer; yoksa satın alınan haktan düşer."
                : "Seçtiğiniz şube için akıllı rapor hazırlanır. Ücretsiz hakkınız varsa o düşer; yoksa satın alınan haktan düşer."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label>Şube</Label>
              <SearchableSelect
                className="h-10 w-full text-sm"
                value={draftBranchId != null ? String(draftBranchId) : ""}
                onValueChange={(next) => {
                  const id = Number(next);
                  if (!Number.isFinite(id) || id <= 0) return;
                  setDraftBranchId(id);
                }}
                options={branches.map((item) => ({ value: String(item.id), label: item.name }))}
                placeholder="Şube seçin"
                searchPlaceholder="Şube ara..."
                emptyText="Şube bulunamadı."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Vazgeç
            </Button>
            <Button
              type="button"
              disabled={!canConfirmSmartReport}
              onClick={() => void startSmartReport()}
            >
              Raporu hazırla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {result?.title || "Akıllı Rapor"}
            </DialogTitle>
            <DialogDescription>
              {smartReport.isGenerating
                ? "Raporunuz arka planda hazırlanıyor. Bu pencereyi kapatabilirsiniz; hazır olunca indirmeye açılacak."
                : failed
                  ? smartReport.job?.errorMessage ||
                    (smartReport.createMutation.error as { response?: { data?: { message?: string } } })
                      ?.response?.data?.message ||
                    "Akıllı rapor üretilemedi."
                  : smartReport.isReady
                    ? "Rapor indirmeye hazır."
                    : result?.summary || "Özet hazır."}
            </DialogDescription>
          </DialogHeader>

          {smartReport.isGenerating ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Hazırlanıyor…
            </div>
          ) : null}

          {result && !smartReport.isGenerating && branchId != null ? (
            <BranchSmartReportStory
              branchId={branchId}
              from={range.from}
              to={range.to}
              branchName={selection?.branch?.name}
              result={result}
              compact
            />
          ) : result && !smartReport.isGenerating ? (
            <div className="space-y-3 text-sm text-foreground">
              <p className="whitespace-pre-wrap text-muted-foreground">{result.summary}</p>
              {result.sections?.slice(0, 3).map((section) => (
                <div key={section.heading} className="rounded-lg border border-border p-3">
                  <p className="font-medium">{section.heading}</p>
                  <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-muted-foreground">
                    {section.body}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Kapat
            </Button>
            {smartReport.job?.jobId ? (
              <Button variant="outline" asChild>
                <Link href={DASHBOARD_ROUTES.smartReportDetail(smartReport.job.jobId)}>
                  Detaya git
                </Link>
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href={DASHBOARD_ROUTES.smartReports}>Rapor gecmisi</Link>
              </Button>
            )}
            {failed && !smartReport.isGenerating ? (
              <Button onClick={() => void handleSmartReportClick()}>
                Tekrar dene
              </Button>
            ) : null}
            {result && !smartReport.isGenerating ? (
              <Button onClick={() => void handleDownloadPdf()} disabled={pdfLoading}>
                {pdfLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                PDF indir
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
      ) : null}

      {noBranches ? (
        <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card p-6 text-sm text-muted-foreground">
          Raporlar için önce bir şube oluşturun.{" "}
          <Link
            href={DASHBOARD_ROUTES.branchCreate}
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            Şube oluştur
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <SlidingTabSelect
              variant="nav"
              ariaLabel="Rapor türü"
              value={reportView}
              onValueChange={(next) => {
                if (next === "revenue" && !canUseRevenue) {
                  return;
                }
                if (next === "personnel" && !canUseRevenue) {
                  return;
                }
                setReportView(next as ReportView);
              }}
              items={[
                { value: "visits", label: "Ürün & Ziyaret" },
                ...(canUseRevenue ? [{ value: "revenue" as const, label: "Ciro" }] : []),
                ...(canUseRevenue ? [{ value: "personnel" as const, label: "Personel" }] : []),
              ]}
            />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <BranchReportPicker
              branches={branches}
              selectedBranchId={branchId}
              selectedQrId={qrId}
              onSelect={(nextBranchId, nextQrId) => {
                select(nextBranchId, nextQrId);
                router.replace(
                  DASHBOARD_ROUTES.digitalMenuAnalyticsForBranch(nextBranchId, nextQrId),
                  { scroll: false },
                );
              }}
            />
            <div className="flex justify-end">
              <SlidingTabSelect
                variant="soft"
                ariaLabel="Rapor dönemi"
                value={period}
                onValueChange={(next) => setPeriod(next as AnalyticsPeriod)}
                items={[
                  { value: "yesterday", label: "Dün" },
                  { value: "1d", label: "Bugün" },
                  { value: "7d", label: "7 gün" },
                  { value: "30d", label: "30 gün" },
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {branchId != null && loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : null}

      {activeReportView === "visits" && branchId != null && reportQuery.isError ? (
        <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card p-6 text-sm text-muted-foreground">
          Rapor yüklenemedi. Yetkinizi ve menü sahipliğini kontrol edin.
        </div>
      ) : null}

      {activeReportView === "revenue" && branchId != null && !canUseRevenue ? (
        <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card p-6 text-sm text-muted-foreground">
          Ciro raporları Pro veya Ultimate paket ile kullanılabilir.{" "}
          <Link
            href={DASHBOARD_ROUTES.accountPackagesHighlight("SMART_REPORTING")}
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            Paketleri incele
          </Link>
        </div>
      ) : null}

      {activeReportView === "revenue" && branchId != null && canUseRevenue && revenueQuery.isError ? (
        <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card p-6 text-sm text-muted-foreground">
          Ciro raporu yüklenemedi. Yetkinizi ve menü sahipliğini kontrol edin.
        </div>
      ) : null}

      {activeReportView === "revenue" && branchId != null && canUseRevenue && !revenueLoading && !revenueQuery.isError && revenueQuery.data ? (
        <BranchReportDashboard
          revenue={revenueQuery.data}
          visits={reportQuery.data}
          waiter={personnelQuery.data}
          loading={revenueLoading}
          allowedTabs={["overview", "revenue", "channels", "products"]}
          initialTab="overview"
        />
      ) : null}

      {activeReportView === "personnel" && branchId != null && !canUseRevenue ? (
        <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card p-6 text-sm text-muted-foreground">
          Personel raporları Pro veya Ultimate paket ile kullanılabilir.{" "}
          <Link
            href={DASHBOARD_ROUTES.accountPackagesHighlight("SMART_REPORTING")}
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            Paketleri incele
          </Link>
        </div>
      ) : null}

      {activeReportView === "personnel" && branchId != null && canUseRevenue && personnelQuery.isError ? (
        <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card p-6 text-sm text-muted-foreground">
          Personel raporu yüklenemedi. Yetkinizi ve menü sahipliğini kontrol edin.
        </div>
      ) : null}

      {activeReportView === "personnel" && branchId != null && canUseRevenue && !personnelLoading && !personnelQuery.isError && personnelQuery.data ? (
        revenueQuery.data ? (
          <BranchReportDashboard
            revenue={revenueQuery.data}
            waiter={personnelQuery.data}
            allowedTabs={["staff"]}
            initialTab="staff"
          />
        ) : (
          <AnalyticsWaiterPerformancePanel
            report={personnelQuery.data}
            tooltipStyle={tooltipStyle}
          />
        )
      ) : null}

      {activeReportView === "visits" && branchId != null && !visitLoading && !reportQuery.isError ? (
        revenueQuery.data ? (
          <BranchReportDashboard
            revenue={revenueQuery.data}
            visits={report}
            allowedTabs={["traffic"]}
            initialTab="traffic"
          />
        ) : (
          <AnalyticsVisitsPanel report={report} tooltipStyle={tooltipStyle} />
        )
      ) : null}
    </div>
  );
}
