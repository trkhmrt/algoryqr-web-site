"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Zap } from "lucide-react";

import RefundConfirmDialog from "@/components/dashboard/RefundConfirmDialog";
import RefundStatusBadge from "@/components/dashboard/RefundStatusBadge";
import RefundStatusPanel from "@/components/dashboard/RefundStatusPanel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { prefetchActivePackages } from "@/hooks/use-subscription";
import {
  formatDaysUntilExpiry,
  formatPackageDate,
  formatPackagePrice,
  purchaseTypeLabel,
} from "@/lib/package-display";
import { invalidateAccessProfile } from "@/hooks/use-access-profile";
import { invalidatePackageUsage } from "@/hooks/use-package-usage";
import {
  invalidateSubscriptionOverview,
  useSubscriptionOverview,
} from "@/hooks/use-subscription-overview";
import { invalidateSubscription } from "@/hooks/use-subscription";
import { usePurchaseFulfillment } from "@/hooks/use-purchase-fulfillment";
import {
  abandonPendingPaymentAttempt,
  canCancelAtPeriodEnd,
  canCancelPurchase,
  canCancelWithRefund,
  canPaySubscriptionDebt,
  canResumeRenewal,
  cancelPurchase,
  cancelPurchaseAtPeriodEnd,
  cancelPurchaseWithRefund,
  clearPendingPurchaseId,
  isSubscriptionPastDue,
  paySubscriptionDebt,
  readPendingPurchaseId,
  resumePurchaseRenewal,
  storePendingPurchaseId,
  type PurchaseInitiateResponse,
} from "@/lib/purchase-fulfillment";
import PaymentCheckoutOverlay, {
  type PaymentCheckoutOverlayContent,
} from "@/components/dashboard/PaymentCheckoutOverlay";
import {
  cancelPlanChange,
  directionLabel,
  listMyPlanChanges,
} from "@/lib/plan-change";
import { refreshAccessAfterEntitlementChange } from "@/lib/refresh-access";
import { formatEntitlementUsageSummary } from "@/lib/entitlement-display";
import { isRefundInFlight, purchaseStatusLabel } from "@/lib/refund-display";
import { ApiError } from "@/lib/api/errors";

interface SubscriptionSectionProps {
  onNotify: (type: "info" | "warning" | "danger", message: string) => void;
}

export default function SubscriptionSection({ onNotify }: SubscriptionSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useSubscriptionOverview();
  const planChangesQuery = useQuery({
    queryKey: ["planChanges"],
    queryFn: listMyPlanChanges,
    staleTime: 15_000,
  });
  const [pendingPurchaseId, setPendingPurchaseId] = useState<number | null>(null);
  const [pollStartedAt, setPollStartedAt] = useState<number | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [paymentOverlay, setPaymentOverlay] = useState<PaymentCheckoutOverlayContent | null>(null);
  const handledPurchaseId = useRef<number | null>(null);
  const fulfillment = usePurchaseFulfillment(
    pendingPurchaseId,
    pendingPurchaseId ? pollStartedAt : null,
  );

  const activePurchase = data?.activePurchase;
  const purchaseId = activePurchase?.id;
  const summary = data?.activePackage ?? null;

  useEffect(() => {
    const payment = searchParams.get("payment");
    const queryPurchaseId = Number(searchParams.get("purchaseId"));
    const resolvedPurchaseId =
      Number.isSafeInteger(queryPurchaseId) && queryPurchaseId > 0
        ? queryPurchaseId
        : readPendingPurchaseId();
    if (resolvedPurchaseId) {
      const startPolling = window.setTimeout(() => {
        setPendingPurchaseId(resolvedPurchaseId);
        setPollStartedAt(Date.now());
      }, 0);
      return () => window.clearTimeout(startPolling);
    }
    if (payment === "failed") {
      void abandonPendingPaymentAttempt({ cancelIfPending: true });
      onNotify("danger", "Ödeme başarısız oldu. Lütfen tekrar deneyin.");
      router.replace(DASHBOARD_ROUTES.accountSubscription);
    } else if (payment === "success") {
      onNotify("warning", "Ödeme sonucu doğrulanamadı. Abonelik durumunuzu kontrol edin.");
      router.replace(DASHBOARD_ROUTES.accountSubscription);
    }
  }, [onNotify, router, searchParams]);

  useEffect(() => {
    const fulfillmentSummary = fulfillment.summary.data;
    if (
      !fulfillmentSummary ||
      pendingPurchaseId !== fulfillmentSummary.purchaseId ||
      handledPurchaseId.current === fulfillmentSummary.purchaseId
    ) return;
    if (fulfillmentSummary.status === "ACTIVE") {
      handledPurchaseId.current = fulfillmentSummary.purchaseId;
      clearPendingPurchaseId();
      void (async () => {
        await refreshAccessAfterEntitlementChange(queryClient);
        await invalidatePackageUsage(queryClient);
        onNotify("info", "Ödeme tamamlandı ve paketiniz aktif edildi.");
        router.replace(DASHBOARD_ROUTES.accountSubscription);
      })();
      return;
    }
    if (fulfillmentSummary.status === "FAILED" || fulfillmentSummary.status === "CANCELLED") {
      handledPurchaseId.current = fulfillmentSummary.purchaseId;
      void abandonPendingPaymentAttempt({ cancelIfPending: true });
      setPaymentOverlay(null);
      onNotify("danger", "Ödeme tamamlanamadı. Lütfen tekrar deneyin.");
      router.replace(DASHBOARD_ROUTES.accountSubscription);
    }
  }, [fulfillment.summary.data, onNotify, pendingPurchaseId, queryClient, router]);

  useEffect(() => {
    if (!fulfillment.timedOut || handledPurchaseId.current === pendingPurchaseId) return;
    handledPurchaseId.current = pendingPurchaseId;
    onNotify("warning", "Ödeme durumu henüz kesinleşmedi. Daha sonra tekrar kontrol edin.");
    router.replace(DASHBOARD_ROUTES.accountSubscription);
  }, [fulfillment.timedOut, onNotify, pendingPurchaseId, router]);

  const refundPending = isRefundInFlight(
    summary?.refundStatus ?? activePurchase?.refundStatus,
  );
  const isActiveTrial =
    activePurchase?.purchaseType === "TRIAL" &&
    !!activePurchase.usable &&
    !activePurchase.expired;
  const packageName =
    summary?.packageName ?? activePurchase?.packageName ?? data?.usage.packageName ?? "Paket";
  const products = summary?.products ?? [];
  const scheduledChange = useMemo(
    () => planChangesQuery.data?.find((item) => item.status === "SCHEDULED") ?? null,
    [planChangesQuery.data],
  );
  const showImmediateCancel = summary ? canCancelPurchase(summary) && !refundPending : false;
  const showCancelAtPeriodEnd = summary ? canCancelAtPeriodEnd(summary) && !refundPending : false;
  const showCancelWithRefund = summary ? canCancelWithRefund(summary) && !refundPending : false;
  const showResumeRenewal = summary ? canResumeRenewal(summary) && !refundPending : false;
  const showPayDebt = summary ? canPaySubscriptionDebt(summary) && !refundPending : false;
  const pastDue = summary
    ? isSubscriptionPastDue(summary)
    : isSubscriptionPastDue(activePurchase ?? {});
  const graceEndsAt = summary?.subscriptionGraceEndsAt ?? activePurchase?.subscriptionGraceEndsAt;
  const hasSavedCard = !!(summary?.paymentMethodId ?? activePurchase?.paymentMethodId);
  const isSubscription = summary?.paymentStyle === "SUBSCRIPTION";

  const cancelPlanChangeMutation = useMutation({
    mutationFn: (id: number) => cancelPlanChange(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["planChanges"] });
      onNotify("info", "Planlanan paket gecisi iptal edildi.");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Planlanan gecis iptal edilemedi.";
      onNotify("danger", message);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelPurchase(purchaseId!),
    onSuccess: async () => {
      setCancelError(null);
      await refreshAccessAfterEntitlementChange(queryClient);
      await Promise.all([
        invalidateSubscriptionOverview(queryClient),
        invalidateSubscription(queryClient),
        invalidatePackageUsage(queryClient),
      ]);
      onNotify("info", "Paket iptal edildi.");
    },
    onError: (error: unknown) => {
      setCancelError(
        error instanceof ApiError
          ? error.message
          : "Paket iptal edilemedi. Lütfen tekrar deneyin.",
      );
    },
  });

  const cancelAtPeriodEndMutation = useMutation({
    mutationFn: () => cancelPurchaseAtPeriodEnd(purchaseId!),
    onSuccess: async () => {
      setCancelError(null);
      await Promise.all([
        invalidateSubscriptionOverview(queryClient),
        invalidateSubscription(queryClient),
        invalidatePackageUsage(queryClient),
        invalidateAccessProfile(queryClient),
      ]);
      onNotify("info", "Yenileme dönem sonunda kapatılacak.");
    },
    onError: (error: unknown) => {
      setCancelError(
        error instanceof ApiError
          ? error.message
          : "Dönem sonu iptal başarısız. Lütfen tekrar deneyin.",
      );
    },
  });

  const cancelWithRefundMutation = useMutation({
    mutationFn: () => cancelPurchaseWithRefund(purchaseId!),
    onSuccess: async () => {
      setCancelError(null);
      await refreshAccessAfterEntitlementChange(queryClient);
      await Promise.all([
        invalidateSubscriptionOverview(queryClient),
        invalidateSubscription(queryClient),
        invalidatePackageUsage(queryClient),
      ]);
      onNotify("info", "İade ile iptal başlatıldı.");
    },
    onError: (error: unknown) => {
      setCancelError(
        error instanceof ApiError
          ? error.message
          : "İade ile iptal başarısız. Lütfen tekrar deneyin.",
      );
    },
  });

  const resumeRenewalMutation = useMutation({
    mutationFn: () => resumePurchaseRenewal(purchaseId!),
    onSuccess: async () => {
      setCancelError(null);
      await refreshAccessAfterEntitlementChange(queryClient);
      await Promise.all([
        invalidateSubscriptionOverview(queryClient),
        invalidateSubscription(queryClient),
        invalidatePackageUsage(queryClient),
      ]);
      onNotify("info", "Yenileme tekrar açıldı.");
    },
    onError: (error: unknown) => {
      setCancelError(
        error instanceof ApiError
          ? error.message
          : "Yenilemeyi açma başarısız. Lütfen tekrar deneyin.",
      );
    },
  });

  const payDebtMutation = useMutation({
    mutationFn: () => paySubscriptionDebt(purchaseId!),
    onSuccess: (response: PurchaseInitiateResponse) => {
      setCancelError(null);
      if (!Number.isSafeInteger(response.purchaseId) || response.purchaseId <= 0) {
        setCancelError("Borç ödeme kimliği alınamadı.");
        return;
      }
      storePendingPurchaseId(response.purchaseId);
      setPendingPurchaseId(response.purchaseId);
      setPollStartedAt(Date.now());
      if (response.paymentPageUrl) {
        setPaymentOverlay({ kind: "url", content: response.paymentPageUrl });
        return;
      }
      if (response.checkoutFormContent) {
        setPaymentOverlay({
          kind: "html",
          content: `<div id="iyzipay-checkout-form" class="responsive"></div>${response.checkoutFormContent}`,
        });
        return;
      }
      setCancelError("Güvenli ödeme sayfası alınamadı.");
    },
    onError: (error: unknown) => {
      setCancelError(
        error instanceof ApiError
          ? error.message
          : "Borç ödeme başlatılamadı. Lütfen tekrar deneyin.",
      );
    },
  });

  if (paymentOverlay) {
    const isPaytr =
      paymentOverlay.kind === "url" && /paytr\.com/i.test(paymentOverlay.content);
    const title = isPaytr ? "Borç ödemesi (PayTR)" : "Borç ödemesi";
    return (
      <PaymentCheckoutOverlay
        overlay={paymentOverlay}
        purchaseId={pendingPurchaseId}
        title={title}
        onClose={() => {
          setPaymentOverlay(null);
          void abandonPendingPaymentAttempt({ cancelIfPending: true });
        }}
      />
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href={DASHBOARD_ROUTES.account}
          className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Abonelik</h1>
          <p className="text-sm text-muted-foreground">Aktif paket ve abonelik detayları</p>
        </div>
      </div>

      {isLoading ? (
        <Card className="glow-card">
          <CardContent className="p-6">
            <div className="h-24 animate-pulse rounded-md bg-muted" />
          </CardContent>
        </Card>
      ) : isError ? (
        <p className="text-sm text-destructive">Abonelik bilgileri yüklenemedi.</p>
      ) : data ? (
        <>
          {summary ? (
            <RefundStatusPanel
              packageName={summary.packageName}
              price={summary.price}
              currency={summary.currency}
              refundableAmount={summary.refundableAmount}
              refundStatus={summary.refundStatus}
              refundedAt={summary.refundedAt}
              cardBrand={summary.cardBrand}
              cardLastFour={summary.cardLastFour}
            />
          ) : null}

          <Card className="glow-card border-primary/20">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Aktif abonelik
                    </p>
                    {(summary?.purchaseType ?? activePurchase?.purchaseType) ? (
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        {purchaseTypeLabel(summary?.purchaseType ?? activePurchase?.purchaseType)}
                      </span>
                    ) : isActiveTrial ? (
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        Deneme
                      </span>
                    ) : null}
                    {(summary?.status ?? activePurchase?.status) ? (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {purchaseStatusLabel(summary?.status ?? activePurchase?.status)}
                      </span>
                    ) : null}
                    {summary ? (
                      <RefundStatusBadge
                        refundStatus={summary.refundStatus}
                        refundedAt={summary.refundedAt}
                      />
                    ) : null}
                  </div>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">{packageName}</h2>
                </div>
                {summary ? (
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-semibold text-foreground">
                      {formatPackagePrice(summary.price, summary.currency)}
                    </p>
                    {summary.purchasedAt ? (
                      <p className="text-xs text-muted-foreground">
                        Satın alma: {formatPackageDate(summary.purchasedAt)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <dl className="overflow-hidden rounded-lg border border-border divide-y divide-border">
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <dt className="text-muted-foreground">Başlangıç</dt>
                  <dd className="text-right font-medium text-foreground">
                    {formatPackageDate(summary?.startsAt ?? activePurchase?.startsAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <dt className="text-muted-foreground">Bitiş</dt>
                  <dd className="text-right font-medium text-foreground">
                    {formatPackageDate(summary?.expiresAt ?? activePurchase?.expiresAt)}
                    {(summary?.daysUntilExpiry ?? activePurchase?.daysUntilExpiry) != null ? (
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                        {formatDaysUntilExpiry(
                          summary?.daysUntilExpiry ?? activePurchase?.daysUntilExpiry,
                        )}
                      </span>
                    ) : null}
                  </dd>
                </div>
                {isSubscription || summary?.paymentStyle ? (
                  <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <dt className="text-muted-foreground">Yenileme</dt>
                    <dd className="text-right font-medium text-foreground">
                      {summary?.cancelAtPeriodEnd || activePurchase?.cancelAtPeriodEnd
                        ? "Kapalı"
                        : isSubscription
                          ? "Otomatik"
                          : "Tek seferlik"}
                    </dd>
                  </div>
                ) : null}
                {(summary?.nextPaymentDueAt ?? activePurchase?.nextPaymentDueAt) ? (
                  <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <dt className="text-muted-foreground">Sonraki ödeme</dt>
                    <dd className="text-right font-medium text-foreground">
                      {formatPackageDate(
                        summary?.nextPaymentDueAt ?? activePurchase?.nextPaymentDueAt,
                      )}
                    </dd>
                  </div>
                ) : null}
                {summary?.cardLastFour ? (
                  <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <dt className="text-muted-foreground">Kart</dt>
                    <dd className="text-right font-medium text-foreground">
                      {[summary.cardBrand, `•••• ${summary.cardLastFour}`]
                        .filter(Boolean)
                        .join(" ")}
                    </dd>
                  </div>
                ) : isSubscription ? (
                  <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <dt className="text-muted-foreground">Kart</dt>
                    <dd className="text-right font-medium text-foreground">Kayıtlı değil</dd>
                  </div>
                ) : null}
                {graceEndsAt && pastDue ? (
                  <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <dt className="text-muted-foreground">Ödeme süresi</dt>
                    <dd className="text-right font-medium text-foreground">
                      {formatPackageDate(graceEndsAt)}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {(summary?.paymentApproaching || activePurchase?.paymentApproaching) ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Ödeme tarihiniz yaklaşıyor.
                </p>
              ) : null}
              {summary?.expiryApproaching ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Paket bitiş tarihiniz 7 gün içinde.
                </p>
              ) : null}
              {pastDue ? (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Yenileme ödemesi alınamadı.{" "}
                  {graceEndsAt
                    ? `Erişiminiz ${formatPackageDate(graceEndsAt)} tarihine kadar devam eder.`
                    : "Erişiminiz kısa süre daha devam eder."}{" "}
                  Dönem ücretini Checkout Form ile ödeyebilirsiniz.
                </p>
              ) : null}
              {!pastDue && isSubscription && !hasSavedCard ? (
                <p className="text-sm text-muted-foreground">
                  Kayıtlı kart yok; otomatik yenileme çalışmaz. Kart ekleyebilir veya dönem
                  gelince borcu manuel ödeyebilirsiniz.
                </p>
              ) : null}
              {(summary?.cancelAtPeriodEnd ?? activePurchase?.cancelAtPeriodEnd) ? (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Yenileme kapalı. Erişiminiz{" "}
                  {formatPackageDate(summary?.expiresAt ?? activePurchase?.expiresAt)} tarihine
                  kadar devam eder.
                </p>
              ) : null}
              {refundPending ? (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  İade işlemi sürüyor. Lütfen bekleyin; tekrar denemeyin.
                </p>
              ) : null}

              {products.length > 0 ? (
                <div className="space-y-2 border-t border-border/60 pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Paketteki ürünler
                  </p>
                  <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {product.productName}
                          </p>
                        </div>
                        <p className="shrink-0 text-xs text-muted-foreground">
                          {formatEntitlementUsageSummary(product)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {showImmediateCancel ||
              showCancelAtPeriodEnd ||
              showCancelWithRefund ||
              showResumeRenewal ||
              showPayDebt ? (
                <div className="space-y-2 border-t border-border/60 pt-4">
                  {cancelError ? <p className="text-sm text-destructive">{cancelError}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    {showPayDebt ? (
                      <Button
                        type="button"
                        variant="hero"
                        size="sm"
                        disabled={payDebtMutation.isPending}
                        onClick={() => payDebtMutation.mutate()}
                      >
                        {payDebtMutation.isPending ? "Ödeme açılıyor…" : "Borcu öde"}
                      </Button>
                    ) : null}
                    {showCancelWithRefund || showCancelAtPeriodEnd ? (
                      <RefundConfirmDialog
                        purchase={{
                          purchaseId: purchaseId!,
                          packageName: summary!.packageName,
                          price: summary!.price,
                          currency: summary!.currency,
                          refundableAmount: summary!.refundableAmount,
                          refundEligibleUntil: summary!.refundEligibleUntil,
                          refundCoolingDays: summary!.refundCoolingDays,
                          cardBrand: summary!.cardBrand,
                          cardLastFour: summary!.cardLastFour,
                        }}
                        allowRefundNow={showCancelWithRefund}
                        allowPeriodEnd={showCancelAtPeriodEnd}
                        isPending={
                          cancelWithRefundMutation.isPending ||
                          cancelAtPeriodEndMutation.isPending
                        }
                        onConfirm={() => cancelWithRefundMutation.mutate()}
                        onPreferPeriodEnd={
                          showCancelAtPeriodEnd
                            ? () => cancelAtPeriodEndMutation.mutate()
                            : undefined
                        }
                      />
                    ) : null}
                    {showResumeRenewal ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={resumeRenewalMutation.isPending}
                        onClick={() => resumeRenewalMutation.mutate()}
                      >
                        {resumeRenewalMutation.isPending ? "Açılıyor…" : "Yenilemeyi tekrar aç"}
                      </Button>
                    ) : null}
                    {showImmediateCancel ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={cancelMutation.isPending}
                          >
                            {cancelMutation.isPending ? "İptal ediliyor…" : "Paketi iptal et"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Paket iptal edilsin mi?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {packageName} paketi hemen iptal edilir.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => cancelMutation.mutate()}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Evet, iptal et
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
                <Button variant="hero" size="sm" asChild>
                  <Link
                    href={DASHBOARD_ROUTES.accountPackages}
                    onMouseEnter={() => prefetchActivePackages(queryClient)}
                  >
                    Paketleri gör
                  </Link>
                </Button>
                {isSubscription && !hasSavedCard ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={DASHBOARD_ROUTES.accountPaymentMethods}>Kart ekle</Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {scheduledChange && (
            <Card className="glow-card border-amber-500/30">
              <CardContent className="p-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Planlanan paket gecisi
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {directionLabel(scheduledChange.direction)}:{" "}
                    {scheduledChange.fromPackageName} → {scheduledChange.toPackageName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatPackageDate(scheduledChange.effectiveAt)} tarihinde devreye girecek ·
                    tahsil:{" "}
                    {formatPackagePrice(scheduledChange.chargeAmount, scheduledChange.currency)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={cancelPlanChangeMutation.isPending}
                  onClick={() => cancelPlanChangeMutation.mutate(scheduledChange.id)}
                >
                  {cancelPlanChangeMutation.isPending ? "Iptal..." : "Planlamayi iptal et"}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
