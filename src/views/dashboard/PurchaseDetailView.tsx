"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, Package, Receipt } from "lucide-react";

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
import { formatDaysUntilExpiry, formatPackageDate, formatPackagePrice } from "@/lib/package-display";
import { canCancelPurchase, canCancelAtPeriodEnd, canCancelWithRefund, canResumeRenewal, cancelPurchase, cancelPurchaseAtPeriodEnd, cancelPurchaseWithRefund, resumePurchaseRenewal, getPurchaseSummary } from "@/lib/purchase-fulfillment";
import { invalidateAccessProfile } from "@/hooks/use-access-profile";
import { invalidatePackageUsage } from "@/hooks/use-package-usage";
import { invalidateSubscription } from "@/hooks/use-subscription";
import { refreshAccessAfterEntitlementChange } from "@/lib/refresh-access";
import { ApiError } from "@/lib/api/errors";

type PurchaseDetailViewProps = {
  purchaseId: number;
};

export default function PurchaseDetailView({ purchaseId }: PurchaseDetailViewProps) {
  const queryClient = useQueryClient();
  const [cancelError, setCancelError] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["purchaseSummary", purchaseId],
    queryFn: () => getPurchaseSummary(purchaseId),
    staleTime: 15_000,
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
          : "Paket iptal edilemedi. Lutfen tekrar deneyin.";
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
          : "Donem sonu iptal basarisiz. Lutfen tekrar deneyin.",
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
        invalidatePackageUsage(queryClient),
      ]);
    },
    onError: (error: unknown) => {
      setCancelError(
        error instanceof ApiError
          ? error.message
          : "Iade ile iptal basarisiz. Lutfen tekrar deneyin.",
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
          : "Yenilemeyi acma basarisiz. Lutfen tekrar deneyin.",
      );
    },
  });

  const installments = data?.installments ?? data?.installmentSchedule ?? [];
  const products = data?.products ?? [];
  const billing = data?.billingSnapshot;
  const showImmediateCancel = data ? canCancelPurchase(data) : false;
  const showCancelAtPeriodEnd = data ? canCancelAtPeriodEnd(data) : false;
  const showCancelWithRefund = data ? canCancelWithRefund(data) : false;
  const showResumeRenewal = data ? canResumeRenewal(data) : false;
  const isSubscription = data?.paymentStyle === "SUBSCRIPTION";

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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Satin alma detayi</h1>
          <p className="text-sm text-muted-foreground">Paket, odeme ve urun bilgileri.</p>
        </div>
      </div>

      {isLoading ? (
        <Card className="glow-card">
          <CardContent className="p-6">
            <div className="h-32 animate-pulse rounded-md bg-muted" />
          </CardContent>
        </Card>
      ) : isError || !data ? (
        <p className="text-sm text-destructive">Satin alma detayi yuklenemedi.</p>
      ) : (
        <>
          <Card className="glow-card">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start gap-2">
                <Package className="mt-0.5 h-4 w-4 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Paket</p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">{data.packageName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.packageCode}
                    {data.purchaseType ? `  |  ${data.purchaseType}` : ""}
                    {`  |  ${data.status}`}
                  </p>
                </div>
                <div className="ml-auto shrink-0 text-right">
                  <p className="text-xl font-semibold text-foreground">
                    {formatPackagePrice(data.price, data.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatPackageDate(data.purchasedAt)}
                  </p>
                </div>
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <p>Baslangic: {formatPackageDate(data.startsAt)}</p>
                <p>
                  Bitis: {formatPackageDate(data.expiresAt)}  |  {formatDaysUntilExpiry(data.daysUntilExpiry)}
                </p>
                <p>Aktiflik: {data.usable && !data.expired ? "Aktif (tarihe gore)" : "Pasif"}</p>
                <p>Odeme modu: {data.paymentMode ?? "-"}</p>
                <p>Odeme stili: {data.paymentStyle ?? "-"}</p>
                {isSubscription ? (
                  <p className="sm:col-span-2 text-foreground">
                    Sonraki odeme:{" "}
                    <span className="font-medium">{formatPackageDate(data.nextPaymentDueAt)}</span>
                  </p>
                ) : (
                  <p>Sonraki odeme: {formatPackageDate(data.nextPaymentDueAt)}</p>
                )}
              </div>
              {(data.paymentApproaching || data.expiryApproaching) && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {data.paymentApproaching
                    ? "Odeme tarihiniz 7 gun icinde."
                    : "Paket bitis tarihiniz 7 gun icinde."}
                </p>
              )}
              {data.cancelAtPeriodEnd ? (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Yenileme kapali. Erisiminiz {formatPackageDate(data.expiresAt)} tarihine kadar
                  devam eder.
                </p>
              ) : null}
              {showImmediateCancel ||
              showCancelAtPeriodEnd ||
              showCancelWithRefund ||
              showResumeRenewal ? (
                <div className="space-y-2 border-t border-border/60 pt-4">
                  {cancelError ? <p className="text-sm text-destructive">{cancelError}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    {showCancelAtPeriodEnd ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="destructive"
                            disabled={cancelAtPeriodEndMutation.isPending}
                          >
                            {cancelAtPeriodEndMutation.isPending
                              ? "Isleniyor..."
                              : "Donem sonunda bitir"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Yenileme kapatilsin mi?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {data.packageName} paketi donem sonuna kadar acik kalir. Sonraki donem
                              icin ucret alinmaz; iade yapilmaz.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Vazgec</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => cancelAtPeriodEndMutation.mutate()}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Donem sonunda bitir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : null}
                    {showCancelWithRefund ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={cancelWithRefundMutation.isPending}
                          >
                            {cancelWithRefundMutation.isPending
                              ? "Iade isleniyor..."
                              : "Hemen iptal et ve iade al"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Iade ile iptal edilsin mi?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {data.packageName} paketi hemen kapanir ve bu donem odemesi iade edilir.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Vazgec</AlertDialogCancel>
                            <AlertDialogAction onClick={() => cancelWithRefundMutation.mutate()}>
                              Iptal et ve iade al
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : null}
                    {showResumeRenewal ? (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={resumeRenewalMutation.isPending}
                        onClick={() => resumeRenewalMutation.mutate()}
                      >
                        {resumeRenewalMutation.isPending ? "Aciliyor..." : "Yenilemeyi tekrar ac"}
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
                            {cancelMutation.isPending ? "Iptal ediliyor..." : "Paketi iptal et"}
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
                            <AlertDialogCancel>Vazgec</AlertDialogCancel>
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
            </CardContent>
          </Card>

          <Card className="glow-card" id="odeme">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">Odeme bilgileri</h3>
              </div>
              <div className="space-y-2 rounded-lg border border-border/70 bg-background p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground">Odeme ID</span>
                  <span className="font-mono text-foreground">{data.paymentId || "-"}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground">Conversation ID</span>
                  <span className="font-mono text-xs text-foreground">
                    {data.paymentConversationId || "-"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground">Odenen tutar</span>
                  <span className="font-medium text-foreground">
                    {formatPackagePrice(data.price, data.currency)}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-background p-4">
                <CreditCard className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Kart</p>
                  {data.cardLastFour ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {(data.cardBrand || "Kart").toString()}  |  **** {data.cardLastFour}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Kart bilgisi kaydi yok (tek seferlik odeme olabilir).
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glow-card">
            <CardContent className="space-y-3 p-6">
              <h3 className="text-sm font-medium text-foreground">Paketteki urunler</h3>
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">Urun kaydi bulunamadi.</p>
              ) : (
                <div className="space-y-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium text-foreground">{product.productName}</p>
                        <p className="text-xs text-muted-foreground">{product.productCode}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {product.unlimited
                          ? "Sinirsiz"
                          : `${product.usedQuantity}/${product.totalQuantity} kullanildi  |  ${product.remainingQuantity} kalan`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {isSubscription ? (
            <Card className="glow-card">
              <CardContent className="space-y-3 p-6">
                <h3 className="text-sm font-medium text-foreground">Odeme donemleri</h3>
                <p className="text-sm text-foreground">
                  Sonraki odeme:{" "}
                  <span className="font-medium">{formatPackageDate(data.nextPaymentDueAt)}</span>
                </p>
                {installments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Donem kaydi yok.</p>
                ) : (
                  <div className="space-y-2">
                    {installments.map((item) => (
                      <div
                        key={`${item.installmentNumber}-${item.status}`}
                        className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 text-sm last:border-0"
                      >
                        <span className="text-muted-foreground">
                          {item.installmentNumber}. donem
                          {item.dueAt ? `  |  ${formatPackageDate(item.dueAt)}` : ""}
                        </span>
                        <span className="text-foreground">
                          {formatPackagePrice(item.amount, item.currency ?? data.currency)}
                          {"  |  "}
                          {item.status === "PAID"
                            ? "Odendi"
                            : item.status === "PENDING"
                              ? "Bekliyor"
                              : item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {billing ? (
            <Card className="glow-card">
              <CardContent className="space-y-2 p-6 text-sm">
                <h3 className="text-sm font-medium text-foreground">Fatura adresi</h3>
                <p className="text-muted-foreground">
                  {[billing.legalName, billing.name, billing.surname].filter(Boolean).join(" ") || "-"}
                </p>
                <p className="text-muted-foreground">
                  {[billing.address, billing.district, billing.city].filter(Boolean).join(", ") || "-"}
                </p>
                {(billing.email || billing.phone) && (
                  <p className="text-muted-foreground">
                    {[billing.email, billing.phone].filter(Boolean).join("  |  ")}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
