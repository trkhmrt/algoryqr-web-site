"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, CreditCard, Zap } from "lucide-react";

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
import { Progress } from "@/components/ui/progress";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  formatDaysUntilExpiry,
  formatPackageDate,
  formatPackagePrice,
  packageFeatures,
} from "@/lib/package-display";
import { invalidatePackageUsage } from "@/hooks/use-package-usage";
import { invalidateSubscription, useSubscription } from "@/hooks/use-subscription";
import { invalidateAccessProfile } from "@/hooks/use-access-profile";
import { usePurchaseFulfillment } from "@/hooks/use-purchase-fulfillment";
import {
  canCancelPurchase,
  cancelPurchase,
  clearPendingPurchaseId,
  readPendingPurchaseId,
} from "@/lib/purchase-fulfillment";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";
import { ApiError } from "@/lib/api/errors";

interface SubscriptionSectionProps {
  onNotify: (type: "info" | "warning" | "danger", message: string) => void;
}

export default function SubscriptionSection({ onNotify }: SubscriptionSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useSubscription();
  const [pendingPurchaseId, setPendingPurchaseId] = useState<number | null>(null);
  const [pollStartedAt, setPollStartedAt] = useState<number | null>(null);
  const handledPurchaseId = useRef<number | null>(null);
  const fulfillment = usePurchaseFulfillment(
    pendingPurchaseId ?? data?.activePurchase?.id ?? null,
    pendingPurchaseId ? pollStartedAt : null,
  );

  useEffect(() => {
    const payment = searchParams.get("payment");
    const queryPurchaseId = Number(searchParams.get("purchaseId"));
    const purchaseId =
      Number.isSafeInteger(queryPurchaseId) && queryPurchaseId > 0
        ? queryPurchaseId
        : readPendingPurchaseId();
    if (purchaseId) {
      const startPolling = window.setTimeout(() => {
        setPendingPurchaseId(purchaseId);
        setPollStartedAt(Date.now());
      }, 0);
      return () => window.clearTimeout(startPolling);
    }
    if (payment === "failed") {
      onNotify("danger", "Ödeme başarısız oldu. Lütfen tekrar deneyin.");
      router.replace(DASHBOARD_ROUTES.accountSubscription);
    } else if (payment === "success") {
      onNotify("warning", "Ödeme sonucu doğrulanamadı. Abonelik durumunuzu kontrol edin.");
      router.replace(DASHBOARD_ROUTES.accountSubscription);
    }
  }, [onNotify, router, searchParams]);

  useEffect(() => {
    const summary = fulfillment.summary.data;
    if (
      !summary ||
      pendingPurchaseId !== summary.purchaseId ||
      handledPurchaseId.current === summary.purchaseId
    ) return;
    if (summary.status === "ACTIVE") {
      handledPurchaseId.current = summary.purchaseId;
      clearPendingPurchaseId();
      void (async () => {
        await getSiteSameOriginAxios().post("/auth/refresh");
        await Promise.all([
          invalidateSubscription(queryClient),
          invalidatePackageUsage(queryClient),
          invalidateAccessProfile(queryClient),
        ]);
        onNotify("info", "Ödeme tamamlandı ve paketiniz aktif edildi.");
        router.replace(DASHBOARD_ROUTES.accountSubscription);
      })();
      return;
    }
    if (summary.status === "FAILED" || summary.status === "CANCELLED") {
      handledPurchaseId.current = summary.purchaseId;
      clearPendingPurchaseId();
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

  const activePackageId = data?.activePurchase?.packageId;
  const usedPercent =
    data?.usage && data.usage.total > 0
      ? Math.round((data.usage.used / data.usage.total) * 100)
      : 0;
  const cancellablePurchase = data?.activePurchase;
  const showCancel = cancellablePurchase ? canCancelPurchase(cancellablePurchase) : false;

  const cancelMutation = useMutation({
    mutationFn: () => {
      if (!cancellablePurchase?.id) {
        throw new Error("Aktif paket bulunamadı");
      }
      return cancelPurchase(cancellablePurchase.id);
    },
    onSuccess: async () => {
      await getSiteSameOriginAxios().post("/auth/refresh");
      await Promise.all([
        invalidateSubscription(queryClient),
        invalidatePackageUsage(queryClient),
        invalidateAccessProfile(queryClient),
      ]);
      onNotify("info", "Paketiniz iptal edildi.");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Paket iptal edilemedi. Lütfen tekrar deneyin.";
      onNotify("danger", message);
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href={DASHBOARD_ROUTES.account}
          className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Abonelik</h1>
          <p className="text-sm text-muted-foreground">Aktif paketinizi görün ve yeni paket satın alın.</p>
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
          <Card className="glow-card border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Aktif abonelik</p>
                  </div>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">{data.usage.packageName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.usage.remaining} QR oluşturma hakkı kaldı
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-3xl font-semibold tabular-nums text-foreground">{data.usage.remaining}</p>
                  <p className="text-xs text-muted-foreground">/ {data.usage.total} hak</p>
                </div>
              </div>
              <Progress value={usedPercent} className="h-1.5" />
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{data.usage.used} kullanıldı</span>
                {data.activePurchase?.expiresAt && (
                  <span>
                    Bitiş: {formatPackageDate(data.activePurchase.expiresAt)} ·{" "}
                    {formatDaysUntilExpiry(data.activePurchase.daysUntilExpiry)}
                  </span>
                )}
                <span>
                  Durum:{" "}
                  {data.activePurchase && data.activePurchase.usable && !data.activePurchase.expired
                    ? "aktif"
                    : "pasif"}
                </span>
                {data.activePurchase?.nextPaymentDueAt && (
                  <span>Sonraki ödeme: {formatPackageDate(data.activePurchase.nextPaymentDueAt)}</span>
                )}
              </div>
              {(data.activePurchase?.paymentApproaching || data.activePurchase?.expiryApproaching) && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {data.activePurchase.paymentApproaching
                    ? "Ödeme tarihiniz yaklaşıyor."
                    : "Paket bitiş tarihiniz yaklaşıyor."}
                </p>
              )}
              {showCancel && cancellablePurchase ? (
                <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-destructive/40 text-destructive hover:bg-destructive/10"
                        disabled={cancelMutation.isPending}
                      >
                        {cancelMutation.isPending ? "İptal ediliyor..." : "Paketi iptal et"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Paket iptal edilsin mi?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {cancellablePurchase.packageName} paketi hemen iptal edilir. Haklarınız ve
                          menü erişiminiz kapanır; iade otomatik yapılmaz.
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
                  <Link
                    href={DASHBOARD_ROUTES.accountPurchaseDetail(cancellablePurchase.id)}
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Satın alma detayı
                  </Link>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {fulfillment.summary.data && (
            <Card className="glow-card">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Son ödeme
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {fulfillment.summary.data.packageName}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {fulfillment.summary.data.status}
                  </span>
                </div>
                {fulfillment.summary.data.status === "PENDING" && (
                  <p className="text-xs text-muted-foreground">
                    Ödeme sağlayıcısından kesin sonuç bekleniyor.
                  </p>
                )}
                {(fulfillment.installments.data ??
                  fulfillment.summary.data.installmentSchedule ??
                  []).map((item) => (
                  <div
                    key={item.installmentNumber}
                    className="flex items-center justify-between gap-3 border-t border-border pt-2 text-xs text-muted-foreground"
                  >
                    <span>
                      {item.installmentNumber}. taksit
                      {item.dueAt ? ` · ${formatPackageDate(item.dueAt)}` : ""}
                    </span>
                    <span>
                      {formatPackagePrice(item.amount, fulfillment.summary.data?.currency ?? "TRY")} · {item.status}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="mb-3 text-sm font-medium text-foreground">Paket kullanım geçmişi</h2>
            {data.purchases.length === 0 ? (
              <p className="mb-6 text-sm text-muted-foreground">Henüz satın alma kaydı yok.</p>
            ) : (
              <div className="mb-6 space-y-2">
                {data.purchases.map((purchase) => (
                  <Link
                    key={purchase.id}
                    href={DASHBOARD_ROUTES.accountPurchaseDetail(purchase.id)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card px-3 py-3 transition-colors hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{purchase.packageName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPackageDate(purchase.purchasedAt)}
                        {purchase.status ? ` · ${purchase.status}` : ""}
                        {purchase.paymentId ? ` · Ödeme: ${purchase.paymentId}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium text-foreground">
                      {formatPackagePrice(purchase.price ?? 0, purchase.currency)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Paketler
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {data.packages.map((pkg) => {
                const isActive = activePackageId === pkg.id && data.activePurchase?.usable && !data.activePurchase?.expired;
                const features = packageFeatures(pkg);

                return (
                  <Card
                    key={pkg.id}
                    className={`glow-card ${isActive ? "border-primary/40 ring-1 ring-primary/20" : ""}`}
                  >
                    <CardContent className="p-5 flex flex-col h-full">
                      {isActive && (
                        <span className="mb-3 inline-flex w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Aktif paketiniz
                        </span>
                      )}
                      <h3 className="text-lg font-semibold text-foreground">{pkg.name}</h3>
                      <p className="mt-1 text-2xl font-bold text-foreground">
                        {formatPackagePrice(pkg.price, pkg.currency)}
                        {pkg.validityDays > 0 && parseFloat(String(pkg.price)) > 0 && (
                          <span className="text-sm font-normal text-muted-foreground"> / {pkg.validityDays} gün</span>
                        )}
                      </p>
                      <ul className="mt-4 space-y-2 flex-1">
                        {features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="mt-5 w-full gap-2"
                        variant={isActive ? "outline" : "hero"}
                        disabled={isActive || parseFloat(String(pkg.price)) <= 0}
                        onClick={() => router.push(DASHBOARD_ROUTES.accountSubscriptionCheckout(pkg.id))}
                      >
                        {isActive
                          ? "Kullanımda"
                          : parseFloat(String(pkg.price)) <= 0
                            ? "Satın alınamaz"
                            : "Paketi Al"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {data.packages.length === 0 && (
              <p className="text-sm text-muted-foreground">Şu an satın alınabilir paket bulunmuyor.</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
