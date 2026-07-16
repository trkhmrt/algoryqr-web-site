"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, CreditCard, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { formatPackageDate, formatPackagePrice, packageFeatures } from "@/lib/package-display";
import { invalidatePackageUsage } from "@/hooks/use-package-usage";
import { invalidateSubscription, useSubscription } from "@/hooks/use-subscription";
import { invalidateAccessProfile } from "@/hooks/use-access-profile";
import { usePurchaseFulfillment } from "@/hooks/use-purchase-fulfillment";
import { clearPendingPurchaseId, readPendingPurchaseId } from "@/lib/purchase-fulfillment";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";

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
                  <span>Bitiş: {formatPackageDate(data.activePurchase.expiresAt)}</span>
                )}
                {data.activePurchase?.status && (
                  <span className="capitalize">Durum: {data.activePurchase.status.toLowerCase()}</span>
                )}
              </div>
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
