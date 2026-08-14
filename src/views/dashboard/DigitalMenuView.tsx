"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight, Crown, Loader2 } from "lucide-react";

import { DigitalMenuIcon } from "@/components/icons/DigitalMenuIcon";

import { useDigitalMenuAccess, useDigitalMenuOptions } from "@/components/dashboard/menu/DigitalMenuPicker";
import TrialPackagePicker from "@/components/dashboard/TrialPackagePicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import {
  invalidateDigitalMenuTrial,
  startTrialRequest,
  useEligibleTrialPackages,
  useTrialStatus,
} from "@/hooks/use-commerce";
import { useActivePackages, useSubscription } from "@/hooks/use-subscription";
import { ApiError, type PlanPackageApiItem } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  canCreateMenu,
  formatMenuQuotaLabel,
  summarizeMenuEntitlements,
} from "@/lib/entitlement-display";
import { formatPackageDate } from "@/lib/package-display";
import { refreshAccessAfterEntitlementChange } from "@/lib/refresh-access";

const FEATURES = [
  "Sınırsız kategori ve ürün yönetimi",
  "Mobil uyumlu profesyonel menü",
  "Anlık fiyat ve içerik güncelleme",
  "Menü ve ürün ziyaret analitiği",
] as const;

export default function DigitalMenuView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const trial = useTrialStatus(!canUseDigitalMenu && !accessLoading);
  const eligibleTrials = useEligibleTrialPackages(!canUseDigitalMenu && !accessLoading);
  const packages = useActivePackages(!canUseDigitalMenu && !accessLoading);
  const subscription = useSubscription(canUseDigitalMenu);
  const menuQuota = summarizeMenuEntitlements(subscription.data?.entitlements ?? []);
  const menuQuotaLabel = formatMenuQuotaLabel(menuQuota);
  const canCreateNewMenu = canCreateMenu(menuQuota);
  const { menuQrs, loading: menusLoading } = useDigitalMenuOptions(canUseDigitalMenu);
  const [startingPackageId, setStartingPackageId] = useState<number | null>(null);
  const status = trial.data?.status ?? "NOT_STARTED";
  const expiredTrial = status === "TRIAL_EXPIRED";
  const needsRenewal = expiredTrial;
  const menuPackage = packages.data?.find((pkg) =>
    pkg.items?.some((item) => item.productCode === "QR_MENU"),
  );
  const packageId = trial.data?.packageId ?? menuPackage?.id ?? null;
  const eligiblePackages = (eligibleTrials.data ?? []) as PlanPackageApiItem[];

  const startTrial = async (selectedPackageId: number) => {
    setStartingPackageId(selectedPackageId);
    try {
      const started = await startTrialRequest(selectedPackageId);
      await refreshAccessAfterEntitlementChange(queryClient);
      await invalidateDigitalMenuTrial(queryClient);
      notify(
        "info",
        `${started.packageName ?? "Paket"} denemeniz başlatıldı` +
          (started.trialEndsAt ? ` · bitiş: ${formatPackageDate(started.trialEndsAt)}` : "") +
          ".",
      );
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Deneme süresi başlatılamadı.");
    } finally {
      setStartingPackageId(null);
    }
  };

  const openPackages = () => {
    router.push(DASHBOARD_ROUTES.accountPackagesHighlight("QR_MENU"));
  };

  const openRenewal = () => {
    if (packageId == null) {
      openPackages();
      return;
    }
    router.push(DASHBOARD_ROUTES.digitalMenuCheckout(packageId));
  };

  if (accessLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (canUseDigitalMenu) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Menü</h1>
            <p className="text-sm text-muted-foreground">Menü QR&apos;larınızı oluşturun ve yönetin.</p>
            {menuQuotaLabel ? (
              <p className="mt-1 text-xs text-muted-foreground">{menuQuotaLabel}</p>
            ) : null}
          </div>
          <Button
            onClick={() => router.push(DASHBOARD_ROUTES.digitalMenuCreate)}
            disabled={!canCreateNewMenu}
          >
            Menü QR Oluştur
          </Button>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">Menülerim</h2>
          {menusLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Menüler yükleniyor…
            </div>
          ) : menuQrs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">Henüz menü oluşturmadınız.</p>
              <Button
                className="mt-4"
                disabled={!canCreateNewMenu}
                onClick={() => router.push(DASHBOARD_ROUTES.digitalMenuCreate)}
              >
                İlk menüyü oluştur
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {menuQrs.map((menuQr) => (
                <Link
                  key={menuQr.id}
                  href={DASHBOARD_ROUTES.digitalMenuEdit(menuQr.id)}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{menuQr.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {String(menuQr.details.businessName ?? "Menü QR")}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Menü</h1>
        <p className="text-sm text-muted-foreground">
          {needsRenewal
            ? "Paket süreniz doldu. Dijital menüye devam etmek için paketi yenileyin."
            : "Canlı menü, anlık güncelleme ve ürün yönetimi için ücretli paket gerekir."}
        </p>
      </div>

      <Card className="glow-card overflow-hidden border-primary/30">
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-[1.15fr_.85fr]">
            <div className="space-y-6 p-6 lg:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <DigitalMenuIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold">Dijital Menü</h2>
                      <Crown className="h-4 w-4 text-amber-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Menü QR oluşturmak ve yönetmek için PRO paket gerekir.
                    </p>
                  </div>
                </div>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2">
                {FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              {needsRenewal && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    Deneme süreniz sona erdi
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PRO özelliklerine devam etmek için paketi satın alın veya yenileyin.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center gap-5 border-t border-border bg-muted/30 p-6 lg:border-l lg:border-t-0 lg:p-8">
              {trial.isLoading || eligibleTrials.isLoading ? (
                <Button disabled className="w-full gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Durum yükleniyor
                </Button>
              ) : (
                <div className="space-y-3">
                  {!needsRenewal && status === "NOT_STARTED" && eligiblePackages.length > 0 && (
                    <TrialPackagePicker
                      packages={eligiblePackages}
                      startingPackageId={startingPackageId}
                      onStart={(id) => void startTrial(id)}
                    />
                  )}
                  <Button
                    variant={needsRenewal ? "outline" : "hero"}
                    className="w-full"
                    onClick={openPackages}
                  >
                    Paketleri karşılaştır
                  </Button>
                  {needsRenewal && (
                    <Button variant="hero" className="w-full" onClick={openRenewal}>
                      Paketi Yenile
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
