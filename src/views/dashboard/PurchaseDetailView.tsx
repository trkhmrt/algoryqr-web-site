"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Package } from "lucide-react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { formatEntitlementRemaining, formatEntitlementUsed } from "@/lib/entitlement-display";
import { formatDaysUntilExpiry, formatPackageDate, formatPackagePrice } from "@/lib/package-display";
import {
  abandonPendingPaymentAttempt,
  canCancelPurchase,
  canCancelAtPeriodEnd,
  canCancelWithRefund,
  canPaySubscriptionDebt,
  canResumeRenewal,
  cancelPurchase,
  cancelPurchaseAtPeriodEnd,
  cancelPurchaseWithRefund,
  resumePurchaseRenewal,
  getPurchaseSummary,
  isSubscriptionPastDue,
  paySubscriptionDebt,
  storePendingPurchaseId,
  type PurchaseInitiateResponse,
} from "@/lib/purchase-fulfillment";
import PaymentCheckoutOverlay, {
  type PaymentCheckoutOverlayContent,
} from "@/components/dashboard/PaymentCheckoutOverlay";
import { isPaytrCheckout, paytrCheckoutHtml } from "@/lib/paytr-checkout";
import { invalidateAccessProfile } from "@/hooks/use-access-profile";
import { invalidatePackageUsage } from "@/hooks/use-package-usage";
import { invalidateSubscription } from "@/hooks/use-subscription";
import { refreshAccessAfterEntitlementChange } from "@/lib/refresh-access";
import { isRefundInFlight, purchaseStatusLabel } from "@/lib/refund-display";
import { ApiError } from "@/lib/api/errors";

type PurchaseDetailViewProps = {
  purchaseId: number;
};

export default function PurchaseDetailView({ purchaseId }: PurchaseDetailViewProps) {
  const queryClient = useQueryClient();
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [paymentOverlay, setPaymentOverlay] = useState<PaymentCheckoutOverlayContent | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["purchaseSummary", purchaseId],
    queryFn: () => getPurchaseSummary(purchaseId),
    staleTime: 15_000,
    refetchInterval: (query) =>
      isRefundInFlight(query.state.data?.refundStatus) ? 2_500 : false,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelPurchase(purchaseId),
    onSuccess: async () => {
      setCancelError(null);
      await refreshAccessAfterEntitlementChange(queryClient);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["purchaseSummary", purchaseId] }),
        invalidatePackageUsage(queryClient),
      ]);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Paket iptal edilemedi. Lütfen tekrar deneyin.";
      setCancelError(message);
    },
  });

  const cancelAtPeriodEndMutation = useMutation({
    mutationFn: () => cancelPurchaseAtPeriodEnd(purchaseId),
    onSuccess: async () => {
      setCancelError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["purchaseSummary", purchaseId] }),
        invalidateSubscription(queryClient),
        invalidatePackageUsage(queryClient),
        invalidateAccessProfile(queryClient),
      ]);
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
    mutationFn: () => cancelPurchaseWithRefund(purchaseId),
    onSuccess: async () => {
      setCancelError(null);
      await refreshAccessAfterEntitlementChange(queryClient);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["purchaseSummary", purchaseId] }),
        invalidateSubscription(queryClient),
        invalidatePackageUsage(queryClient),
      ]);
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
    mutationFn: () => resumePurchaseRenewal(purchaseId),
    onSuccess: async () => {
      setCancelError(null);
      await refreshAccessAfterEntitlementChange(queryClient);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["purchaseSummary", purchaseId] }),
        invalidatePackageUsage(queryClient),
      ]);
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
    mutationFn: () => paySubscriptionDebt(purchaseId),
    onSuccess: (response: PurchaseInitiateResponse) => {
      setCancelError(null);
      if (!Number.isSafeInteger(response.purchaseId) || response.purchaseId <= 0) {
        setCancelError("Borç ödeme kimliği alınamadı.");
        return;
      }
      storePendingPurchaseId(response.purchaseId);
      if (response.paymentPageUrl) {
        setPaymentOverlay({ kind: "url", content: response.paymentPageUrl });
        return;
      }
      if (response.checkoutFormContent) {
        setPaymentOverlay({
          kind: "html",
          content: paytrCheckoutHtml(response.checkoutFormContent),
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

  const products = data?.products ?? [];
  const refundPending = isRefundInFlight(data?.refundStatus);
  const showImmediateCancel = data ? canCancelPurchase(data) && !refundPending : false;
  const showCancelAtPeriodEnd = data ? canCancelAtPeriodEnd(data) && !refundPending : false;
  const showCancelWithRefund = data ? canCancelWithRefund(data) && !refundPending : false;
  const showResumeRenewal = data ? canResumeRenewal(data) && !refundPending : false;
  const showPayDebt = data ? canPaySubscriptionDebt(data) && !refundPending : false;
  const isSubscription = data?.paymentStyle === "SUBSCRIPTION";
  const pastDue = data ? isSubscriptionPastDue(data) : false;

  if (paymentOverlay) {
    const title = isPaytrCheckout(paymentOverlay) ? "Borç ödemesi (PayTR)" : "Borç ödemesi";
    return (
      <PaymentCheckoutOverlay
        overlay={paymentOverlay}
        purchaseId={purchaseId}
        title={title}
        onClose={() => {
          setPaymentOverlay(null);
          void abandonPendingPaymentAttempt({ cancelIfPending: true });
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href={DASHBOARD_ROUTES.accountSubscription}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Paket detayı</h1>
          <p className="text-sm text-muted-foreground">Paket hakları ve abonelik işlemleri.</p>
        </div>
      </div>

      {isLoading ? (
        <Card className="glow-card">
          <CardContent className="p-6">
            <div className="h-32 animate-pulse rounded-md bg-muted" />
          </CardContent>
        </Card>
      ) : isError || !data ? (
        <p className="text-sm text-destructive">Paket detayı yüklenemedi.</p>
      ) : (
        <>
          <RefundStatusPanel
            packageName={data.packageName}
            price={data.price}
            currency={data.currency}
            refundableAmount={data.refundableAmount}
            refundStatus={data.refundStatus}
            refundedAt={data.refundedAt}
            cardBrand={data.cardBrand}
            cardLastFour={data.cardLastFour}
          />

          <Card className="glow-card">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start gap-3">
                <Package className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Paket</p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">{data.packageName}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {data.packageCode ? (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {data.packageCode}
                      </span>
                    ) : null}
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      #{purchaseId}
                    </span>
                    {data.purchaseType ? (
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        {data.purchaseType}
                      </span>
                    ) : null}
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {purchaseStatusLabel(data.status)}
                    </span>
                    <RefundStatusBadge
                      refundStatus={data.refundStatus}
                      refundedAt={data.refundedAt}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xl font-semibold text-foreground">
                    {formatPackagePrice(data.price, data.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatPackageDate(data.purchasedAt)}
                  </p>
                </div>
              </div>

              <dl className="overflow-hidden rounded-lg border border-border divide-y divide-border">
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <dt className="text-muted-foreground">Başlangıç</dt>
                  <dd className="text-right font-medium text-foreground">
                    {formatPackageDate(data.startsAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <dt className="text-muted-foreground">Bitiş</dt>
                  <dd className="text-right font-medium text-foreground">
                    {formatPackageDate(data.expiresAt)}
                    {data.daysUntilExpiry != null ? (
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                        {formatDaysUntilExpiry(data.daysUntilExpiry)}
                      </span>
                    ) : null}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <dt className="text-muted-foreground">Aktiflik</dt>
                  <dd className="text-right font-medium text-foreground">
                    {data.usable && !data.expired ? "Aktif (tarihe göre)" : "Pasif"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <dt className="text-muted-foreground">Ödeme stili</dt>
                  <dd className="text-right font-medium text-foreground">
                    {data.paymentStyle ?? "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <dt className="text-muted-foreground">Ödeme modu</dt>
                  <dd className="text-right font-medium text-foreground">
                    {data.paymentMode ?? "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <dt className="text-muted-foreground">Sonraki ödeme</dt>
                  <dd className="text-right font-medium text-foreground">
                    {formatPackageDate(data.nextPaymentDueAt)}
                  </dd>
                </div>
                {isSubscription ? (
                  <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <dt className="text-muted-foreground">Yenileme</dt>
                    <dd className="text-right font-medium text-foreground">
                      {data.cancelAtPeriodEnd ? "Kapalı" : "Otomatik"}
                    </dd>
                  </div>
                ) : null}
                {data.cardLastFour ? (
                  <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <dt className="text-muted-foreground">Kart</dt>
                    <dd className="text-right font-medium text-foreground">
                      {[data.cardBrand, `•••• ${data.cardLastFour}`].filter(Boolean).join(" ")}
                    </dd>
                  </div>
                ) : isSubscription ? (
                  <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <dt className="text-muted-foreground">Kart</dt>
                    <dd className="text-right font-medium text-foreground">Kayıtlı değil</dd>
                  </div>
                ) : null}
                {pastDue && data.subscriptionGraceEndsAt ? (
                  <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <dt className="text-muted-foreground">Ödeme süresi</dt>
                    <dd className="text-right font-medium text-foreground">
                      {formatPackageDate(data.subscriptionGraceEndsAt)}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {(data.paymentApproaching || data.expiryApproaching) && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {data.paymentApproaching
                    ? "Ödeme tarihiniz 7 gün içinde."
                    : "Paket bitiş tarihiniz 7 gün içinde."}
                </p>
              )}
              {pastDue ? (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Yenileme ödemesi alınamadı.{" "}
                  {data.subscriptionGraceEndsAt
                    ? `Erişiminiz ${formatPackageDate(data.subscriptionGraceEndsAt)} tarihine kadar devam eder.`
                    : "Erişiminiz kısa süre daha devam eder."}{" "}
                  Dönem ücretini Checkout Form ile ödeyebilirsiniz.
                </p>
              ) : null}
              {!pastDue && isSubscription && !data.paymentMethodId ? (
                <p className="text-sm text-muted-foreground">
                  Kayıtlı kart yok; otomatik yenileme çalışmaz. PayTR ödemesinde kart kaydı
                  açabilir veya dönem gelince borcu manuel ödeyebilirsiniz.
                </p>
              ) : null}
              {data.cancelAtPeriodEnd ? (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Yenileme kapalı. Erişiminiz {formatPackageDate(data.expiresAt)} tarihine kadar
                  devam eder.
                </p>
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
                        disabled={payDebtMutation.isPending}
                        onClick={() => payDebtMutation.mutate()}
                      >
                        {payDebtMutation.isPending ? "Ödeme açılıyor…" : "Borcu öde"}
                      </Button>
                    ) : null}
                    {showCancelWithRefund || showCancelAtPeriodEnd ? (
                      <RefundConfirmDialog
                        purchase={{
                          purchaseId,
                          packageName: data.packageName,
                          price: data.price,
                          currency: data.currency,
                          refundableAmount: data.refundableAmount,
                          refundEligibleUntil: data.refundEligibleUntil,
                          refundCoolingDays: data.refundCoolingDays,
                          cardBrand: data.cardBrand,
                          cardLastFour: data.cardLastFour,
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
                            disabled={cancelMutation.isPending}
                          >
                            {cancelMutation.isPending ? "İptal ediliyor…" : "Paketi iptal et"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Paket iptal edilsin mi?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {data.packageName} paketi hemen iptal edilir.
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
              {isSubscription && !data.paymentMethodId ? (
                <div className="border-t border-border/60 pt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={DASHBOARD_ROUTES.accountPaymentMethods}>Kayıtlı kartlar</Link>
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="glow-card">
            <CardContent className="space-y-3 p-6">
              <h3 className="text-sm font-medium text-foreground">Paketteki ürünler</h3>
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ürün kaydı bulunamadı.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-10 px-3">Ürün</TableHead>
                        <TableHead className="h-10 px-3 text-right">Kullanılan</TableHead>
                        <TableHead className="h-10 px-3 text-right">Kalan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id} className="hover:bg-muted/30">
                          <TableCell className="px-3 py-2.5 font-medium text-foreground">
                            {product.productName}
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-right text-muted-foreground">
                            {formatEntitlementUsed(product)}
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-right font-medium text-foreground">
                            {formatEntitlementRemaining(product)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
