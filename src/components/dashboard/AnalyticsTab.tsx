"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  Users,
  ShoppingBag,
  Layers,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Treemap,
  Legend,
} from "recharts";

import { useDigitalMenuOptions, useDigitalMenuSelection } from "@/components/dashboard/menu/DigitalMenuPicker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useAccessProfile } from "@/hooks/use-access-profile";
import { useMenuAnalyticsReport } from "@/hooks/use-menu-analytics-report";
import { useSmartReportJob } from "@/hooks/use-smart-report-job";
import { useActivePackages, useSubscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import { hasProduct, hasScope } from "@/lib/auth-user";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { formatPackagePrice, packageFeatures } from "@/lib/package-display";
import {
  hasActiveProductAccess,
  isDateUsablePurchase,
  matchesProductCode,
} from "@/lib/product-access";
import { downloadSmartReportPdf } from "@/lib/smart-report-pdf";
import { getSmartReportQuotaRequest, buildSmartReportMarkdown, isSmartReportQuotaExhausted, normalizeSmartReportResult } from "@/lib/smart-report";

const c = (token: string) => `hsl(var(--chart-${token}))`;

const COLORS = {
  green: c("green"),
  indigo: c("indigo"),
  teal: c("teal"),
  violet: c("violet"),
  red: c("red"),
  orange: c("orange"),
  stone: c("stone"),
};

const DEVICE_FILLS = [COLORS.indigo, COLORS.orange, COLORS.teal];
const JOURNEY_PAGE_SIZE = 5;

function SmartReportButton({
  className,
  disabled,
  loading,
  label = "Akıllı Rapor",
  onClick,
}: {
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`rainbow-beam shrink-0 disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
    >
      <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        {label}
      </span>
    </button>
  );
}

function useTooltipStyle() {
  if (typeof document === "undefined") {
    return {
      backgroundColor: "hsl(0 0% 100%)",
      border: "1px solid hsl(0 0% 88%)",
      borderRadius: "8px",
      fontSize: "12px",
      color: "hsl(0 0% 10%)",
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

const gridStroke = "hsl(0 0% 15%)";
const axisStroke = "hsl(0 0% 40%)";

type AnalyticsPeriod = "1d" | "7d" | "30d";

function periodRange(period: AnalyticsPeriod) {
  const to = new Date();
  const from = new Date();
  if (period !== "1d") {
    const days = period === "7d" ? 6 : 29;
    from.setDate(to.getDate() - days);
  }
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function TreemapContent(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  index?: number;
}) {
  const { x = 0, y = 0, width = 0, height = 0, name = "", index = 0 } = props;
  if (width < 40 || height < 24) return null;
  const fills = [COLORS.indigo, COLORS.teal, COLORS.green, COLORS.violet, COLORS.orange];
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{ fill: fills[index % fills.length], stroke: "hsl(var(--background))", strokeWidth: 2 }}
        rx={4}
      />
      <text x={x + 8} y={y + 18} fill="white" fontSize={11}>
        {name}
      </text>
    </g>
  );
}

function useAnalyticsAccess() {
  const { data: accessProfile, isLoading: accessLoading } = useAccessProfile();
  const subscription = useSubscription();
  const packages = useActivePackages();
  const entitlements = Array.isArray(subscription.data?.entitlements)
    ? subscription.data.entitlements
    : [];
  const purchases = Array.isArray(subscription.data?.purchases) ? subscription.data.purchases : [];
  const activePurchase = subscription.data?.activePurchase ?? null;
  const activePackage =
    packages.data?.find(
      (pkg) => activePurchase?.packageId != null && pkg.id === activePurchase.packageId,
    ) ??
    packages.data?.find(
      (pkg) =>
        !!activePurchase?.packageCode && pkg.code === activePurchase.packageCode,
    ) ??
    null;
  const activePackageHasSmartReporting =
    !!activePurchase &&
    isDateUsablePurchase(activePurchase) &&
    !!activePackage?.items?.some((item) =>
      matchesProductCode(item.productCode, "SMART_REPORTING"),
    );
  const canUse =
    hasActiveProductAccess(entitlements, purchases, "SMART_REPORTING") ||
    hasScope(accessProfile, "QR_ANALYTICS_OWNER") ||
    hasProduct(accessProfile, "QR_ANALYTICS") ||
    activePackageHasSmartReporting;
  return {
    accessLoading: accessLoading || subscription.isLoading || packages.isLoading,
    canUse,
  };
}

const ANALYTICS_FEATURES = [
  "Menü ziyaret ve oturum raporları",
  "Ürün ve kategori görüntüleme analizi",
  "Saatlik yoğunluk ve cihaz dağılımı",
  "Oturum yolculuk örnekleri",
] as const;

function AnalyticsLockedView({ backHref }: { backHref: string }) {
  const packages = useActivePackages();
  const ultimate =
    packages.data?.find((pkg) =>
      pkg.items?.some((item) => matchesProductCode(item.productCode, "SMART_REPORTING")),
    ) ??
    packages.data?.find((pkg) => pkg.code === "ULTIMATE_PACKAGE") ??
    null;
  const features = ultimate ? packageFeatures(ultimate).slice(0, 5) : [...ANALYTICS_FEATURES];
  const checkoutHref = ultimate
    ? DASHBOARD_ROUTES.accountSubscriptionCheckout(ultimate.id)
                : DASHBOARD_ROUTES.accountPackagesHighlight("SMART_REPORTING");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={backHref}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Raporlama</h1>
            <p className="text-sm text-muted-foreground">
              Akıllı Raporlama için Ultimate paket gerekir.
            </p>
          </div>
        </div>
        <SmartReportButton disabled />
      </div>

      <Card className="glow-card overflow-hidden border-primary/30">
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-[1.15fr_.85fr]">
            <div className="space-y-6 p-6 lg:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-foreground">
                      {ultimate?.name ?? "Ultimate"}
                    </h2>
                    <Crown className="h-4 w-4 text-amber-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {ultimate?.description?.trim() ||
                      "Akıllı Raporlama ile menü ziyaretlerini ve ürün performansını takip edin."}
                  </p>
                </div>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col justify-center gap-4 border-t border-border bg-muted/30 p-6 lg:border-l lg:border-t-0 lg:p-8">
              {packages.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Paket yükleniyor
                </div>
              ) : (
                <>
                  {ultimate ? (
                    <div>
                      <p className="text-3xl font-bold tracking-tight text-foreground">
                        {formatPackagePrice(ultimate.price, ultimate.currency)}
                      </p>
                      {ultimate.validityDays ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {ultimate.validityDays === 30
                            ? "aylık"
                            : ultimate.validityDays === 365 || ultimate.validityDays === 366
                              ? "yıllık"
                              : `${ultimate.validityDays} gün`}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <Button variant="hero" className="w-full" asChild>
                    <Link href={checkoutHref}>
                      {ultimate ? `${ultimate.name} paketine geç` : "Paketleri incele"}
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={DASHBOARD_ROUTES.accountPackagesHighlight("SMART_REPORTING")}>
                      Paketleri karşılaştır
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AnalyticsTab() {
  const searchParams = useSearchParams();
  const initialQrId = useMemo(() => {
    const raw = Number(searchParams.get("qr"));
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
  }, [searchParams]);
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [journeyPage, setJourneyPage] = useState(0);
  const tooltipStyle = useTooltipStyle();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { accessLoading, canUse } = useAnalyticsAccess();
  const { menuQrs, loading: menusLoading } = useDigitalMenuOptions();
  const { selection, loading: selectionLoading } = useDigitalMenuSelection(initialQrId);
  const range = useMemo(() => periodRange(period), [period]);
  const menuId = selection?.menu.menuId ?? null;
  const reportQuery = useMenuAnalyticsReport(menuId, range.from, range.to, canUse && menuId != null);
  const report = reportQuery.data;
  const smartReport = useSmartReportJob({
    menuId,
    from: range.from,
    to: range.to,
  });
  const quotaQuery = useQuery({
    queryKey: ["smart-reports", "quota"],
    queryFn: getSmartReportQuotaRequest,
    enabled: canUse,
  });
  const quota = quotaQuery.data;
  const quotaExhausted = isSmartReportQuotaExhausted(quota);
  const backHref =
    selection?.qr.id != null
      ? DASHBOARD_ROUTES.digitalMenuEdit(selection.qr.id)
      : initialQrId != null
        ? DASHBOARD_ROUTES.digitalMenuEdit(initialQrId)
        : DASHBOARD_ROUTES.digitalMenu;
  const menuLabel =
    selection?.menu.businessName?.trim() ||
    selection?.qr.name ||
    null;

  const result = normalizeSmartReportResult(smartReport.job);
  const failed = smartReport.isFailed;
  const wasGeneratingRef = useRef(false);

  useEffect(() => {
    if (smartReport.isGenerating) {
      wasGeneratingRef.current = true;
    }
  }, [smartReport.isGenerating]);

  useEffect(() => {
    setJourneyPage(0);
  }, [menuId, range.from, range.to]);

  useEffect(() => {
    if (!smartReport.isReady || !wasGeneratingRef.current) return;
    wasGeneratingRef.current = false;
    setDialogOpen(true);
    toast({
      title: "Rapor indirmeye hazır",
      description: "Akıllı raporunuz hazır. PDF olarak indirebilirsiniz.",
    });
  }, [smartReport.isReady, toast]);

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
      toast({
        title: "Gunluk hak doldu",
        description:
          quota?.period === "WEEK"
            ? "Bu haftaki akilli rapor hakkiniz kullanildi."
            : "Bugunku akilli rapor hakkiniz kullanildi.",
        variant: "destructive",
      });
      return;
    }
    if (menuId == null) {
      toast({
        title: "Menü seçin",
        description: "Akıllı rapor için önce bir menü QR seçin.",
        variant: "destructive",
      });
      return;
    }
    if (reportQuery.isError || !report) {
      toast({
        title: "Rapor hazır değil",
        description: "Analitik rapor yüklenmeden akıllı rapor üretilemez.",
        variant: "destructive",
      });
      return;
    }
    setConfirmOpen(true);
  }

  async function startSmartReport() {
    if (menuId == null) return;
    setConfirmOpen(false);
    try {
      const body = {
        menuId,
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
          ? "Bugunku akilli rapor hakkiniz kullanildi"
          : "Akıllı rapor başlatılamadı.");
      toast({ title: "Hata", description: message, variant: "destructive" });
      if (status === 429) {
        await queryClient.invalidateQueries({ queryKey: ["smart-reports", "quota"] });
      }
    }
  }

  async function handleDownloadPdf() {
    if (!result) return;
    setPdfLoading(true);
    try {
      const markdown = buildSmartReportMarkdown(result);
      await downloadSmartReportPdf({
        title: result.title || "Akilli Rapor",
        markdown,
        fileName: `akilli-rapor-${menuId ?? "menu"}-${range.from}-${range.to}.pdf`,
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

  if (accessLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!canUse) {
    return (
      <AnalyticsLockedView backHref={backHref} />
    );
  }

  const daily = (report?.daily ?? []).map((row) => ({
    ...row,
    dateLabel: formatShortDate(row.date),
  }));
  const hourly = (report?.hourly ?? []).map((row) => ({
    hour: String(row.hour).padStart(2, "0"),
    views: row.views,
  }));
  const deviceTotal = (report?.devices ?? []).reduce((sum, d) => sum + d.value, 0);
  const devices = (report?.devices ?? []).map((d, i) => ({
    ...d,
    fill: DEVICE_FILLS[i % DEVICE_FILLS.length],
    pct: deviceTotal > 0 ? Math.round((d.value / deviceTotal) * 100) : 0,
  }));
  const funnel = [
    { name: "Menü", value: report?.funnel.menuOpens ?? 0 },
    { name: "Kategori", value: report?.funnel.categoryViews ?? 0 },
    { name: "Ürün", value: report?.funnel.productViews ?? 0 },
  ];
  const treeData = (report?.categoryProductTree ?? []).map((node) => ({
    name: node.name,
    size: node.size,
    children: (node.children ?? []).map((child) => ({
      name: child.name,
      size: child.size,
    })),
  }));
  const kpis = [
    {
      label: "Oturum",
      value: report?.kpis.sessions ?? 0,
      icon: Users,
      color: COLORS.indigo,
    },
    {
      label: "Menü açılışı",
      value: report?.kpis.menuOpens ?? 0,
      icon: Eye,
      color: COLORS.teal,
    },
    {
      label: "Ürün görüntüleme",
      value: report?.kpis.productViews ?? 0,
      icon: ShoppingBag,
      color: COLORS.green,
    },
    {
      label: "Ort. ürün / oturum",
      value: (report?.kpis.avgProductsPerSession ?? 0).toFixed(1),
      icon: Layers,
      color: COLORS.orange,
    },
  ];
  const loading = menusLoading || selectionLoading || reportQuery.isLoading;
  const empty = !loading && (report?.kpis.sessions ?? 0) === 0 && (report?.kpis.menuOpens ?? 0) === 0;
  const canGenerate =
    menuId != null &&
    !loading &&
    !reportQuery.isError &&
    !!report &&
    !smartReport.isGenerating &&
    !quotaExhausted;
  const smartReportLabel = smartReport.isReady
    ? "İndirmeye hazır"
    : smartReport.isGenerating
      ? "Hazırlanıyor…"
      : quotaExhausted
        ? "Hak doldu"
        : failed
          ? "Tekrar dene"
          : "Akıllı Rapor";
  const sampleJourneys = report?.sampleJourneys ?? [];
  const journeyTotalPages = Math.max(1, Math.ceil(sampleJourneys.length / JOURNEY_PAGE_SIZE));
  const safeJourneyPage = Math.min(journeyPage, journeyTotalPages - 1);
  const pagedJourneys = sampleJourneys.slice(
    safeJourneyPage * JOURNEY_PAGE_SIZE,
    safeJourneyPage * JOURNEY_PAGE_SIZE + JOURNEY_PAGE_SIZE,
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={backHref}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Raporlama</h1>
            <p className="text-sm text-muted-foreground">
              {menuLabel
                ? `${menuLabel} · menü ziyaret ve yolculuk raporları`
                : "Menü QR ziyaret ve yolculuk raporları."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 sm:ml-auto">
          <Link
            href={DASHBOARD_ROUTES.smartReports}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Rapor gecmisi
          </Link>
          <SmartReportButton
            loading={smartReport.isGenerating}
            disabled={
              smartReport.isReady
                ? false
                : smartReport.isGenerating
                  ? true
                  : !canGenerate
            }
            label={smartReportLabel}
            onClick={() => handleSmartReportClick()}
          />
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Akıllı rapor oluşturulsun mu?</AlertDialogTitle>
            <AlertDialogDescription>
              {quota?.period === "WEEK"
                ? "Bu hafta için akıllı rapor hak sayınız sınırlıdır. Hakkınızı kullanmak istiyor musunuz?"
                : "Akıllı rapor günde bir kez alınabilir. Bugünkü hakkınızı kullanmak istiyor musunuz?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={() => void startSmartReport()}>
              Raporu hazırla
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
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

          {result && !smartReport.isGenerating ? (
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

      {menuQrs.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Raporlama için önce bir menü QR oluşturun.{" "}
          <Link
            href={DASHBOARD_ROUTES.digitalMenuCreate}
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            Menü oluştur
          </Link>
        </div>
      ) : null}

      {menuId != null && loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : null}

      {menuId != null && reportQuery.isError ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Rapor yüklenemedi. Yetkinizi ve menü sahipliğini kontrol edin.
        </div>
      ) : null}

      {menuId != null && !loading && !reportQuery.isError ? (
        <>
          <div className="flex justify-end">
            <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
              {(
                [
                  { key: "1d" as const, label: "Bugün" },
                  { key: "7d" as const, label: "7 Gün" },
                  { key: "30d" as const, label: "30 Gün" },
                ] as const
              ).map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    period === p.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {empty ? (
            <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
              Seçilen dönemde henüz ziyaret verisi yok. Public menü taramaları burada görünecek.
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glow-card rounded-lg border bg-card text-card-foreground shadow-sm"
              >
                <div className="p-5">
                  <m.icon className="h-4 w-4" style={{ color: m.color }} />
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                    {typeof m.value === "number" ? m.value.toLocaleString("tr-TR") : m.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="glow-card rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-sm font-medium text-foreground">Günlük oturum & görüntüleme</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily}>
                  <defs>
                    <linearGradient id="gradSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.indigo} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={COLORS.indigo} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradOpens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.teal} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={COLORS.teal} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="dateLabel" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Area type="monotone" dataKey="sessions" name="Oturum" stroke={COLORS.indigo} strokeWidth={2} fill="url(#gradSessions)" />
                  <Area type="monotone" dataKey="menuOpens" name="Menü açılışı" stroke={COLORS.teal} strokeWidth={2} fill="url(#gradOpens)" />
                  <Area type="monotone" dataKey="productViews" name="Ürün" stroke={COLORS.green} strokeWidth={1.5} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glow-card rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-sm font-medium text-foreground">Saatlik yoğunluk</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourly}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="hour" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="views" name="Görüntüleme" fill={COLORS.green} radius={[4, 4, 0, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glow-card rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-sm font-medium text-foreground">Cihaz dağılımı</h2>
              <div className="h-56 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={devices} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      {devices.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.fill} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 min-w-[120px]">
                  {devices.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className="text-xs text-muted-foreground">{d.name}</span>
                      <span className="text-xs font-medium text-foreground ml-auto">{d.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glow-card rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-sm font-medium text-foreground">En çok görüntülenen ürünler</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...(report?.topProducts ?? [])].reverse()}
                    layout="vertical"
                    margin={{ left: 16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis type="number" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      stroke={axisStroke}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="views" name="Görüntüleme" fill={COLORS.indigo} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glow-card rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-sm font-medium text-foreground">En çok görüntülenen kategoriler</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report?.topCategories ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="views" name="Görüntüleme" fill={COLORS.violet} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glow-card rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-sm font-medium text-foreground">Kategori → ürün yoğunluk</h2>
              <div className="h-64">
                {treeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                      data={treeData}
                      dataKey="size"
                      nameKey="name"
                      stroke="hsl(var(--background))"
                      content={<TreemapContent />}
                    />
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground py-12 text-center">Veri yok</p>
                )}
              </div>
            </div>

            <div className="glow-card rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-sm font-medium text-foreground">Funnel: menü → kategori → ürün</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={funnel}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" name="Adım" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glow-card rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-sm font-medium text-foreground">Örnek oturum yolculukları</h2>
            {sampleJourneys.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz yolculuk örneği yok.</p>
            ) : (
              <div className="space-y-4">
                {pagedJourneys.map((journey) => (
                  <div key={journey.sessionId} className="rounded-lg border border-border p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{journey.sessionId.slice(0, 8)}</span>
                      <span>
                        {new Date(journey.startedAt).toLocaleString("tr-TR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {journey.steps.map((step, idx) => (
                        <span
                          key={`${journey.sessionId}-${idx}`}
                          className="rounded-md border border-border bg-accent/40 px-2 py-1 text-xs text-foreground"
                        >
                          {step.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {journeyTotalPages > 1 ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground">
                      Toplam {sampleJourneys.length} yolculuk · Sayfa {safeJourneyPage + 1} /{" "}
                      {journeyTotalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        disabled={safeJourneyPage <= 0}
                        onClick={() => setJourneyPage((current) => Math.max(0, current - 1))}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Önceki
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        disabled={safeJourneyPage >= journeyTotalPages - 1}
                        onClick={() =>
                          setJourneyPage((current) => Math.min(journeyTotalPages - 1, current + 1))
                        }
                      >
                        Sonraki
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
