"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, CreditCard, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { formatPackageDate, formatPackagePrice, packageFeatures } from "@/lib/package-display";
import { invalidatePackageUsage } from "@/hooks/use-package-usage";
import { invalidateSubscription, useSubscription } from "@/hooks/use-subscription";

interface SubscriptionSectionProps {
  onNotify: (type: "info" | "warning" | "danger", message: string) => void;
}

export default function SubscriptionSection({ onNotify }: SubscriptionSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useSubscription();

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (!payment) return;

    const message = searchParams.get("message");
    if (payment === "success") {
      void Promise.all([
        invalidateSubscription(queryClient),
        invalidatePackageUsage(queryClient),
      ]).then(() => {
        onNotify("info", "3DS ödeme başarılı! Paketiniz hesabınıza tanımlandı.");
        router.replace(DASHBOARD_ROUTES.accountSubscription);
      });
      return;
    }
    if (payment === "failed") {
      onNotify("danger", message || "Ödeme tamamlanamadı.");
      router.replace(DASHBOARD_ROUTES.accountSubscription);
    }
  }, [onNotify, queryClient, router, searchParams]);

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
                        disabled={isActive}
                        onClick={() => router.push(DASHBOARD_ROUTES.accountSubscriptionCheckout(pkg.id))}
                      >
                        {isActive ? "Kullanımda" : "Paketi Al"}
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
