"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Clock3, Crown, FolderTree, Loader2, Package, UtensilsCrossed } from "lucide-react";

import { useDigitalMenuOptions } from "@/components/dashboard/menu/DigitalMenuPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { invalidateAccessProfile, useAccessProfile } from "@/hooks/use-access-profile";
import { invalidateDigitalMenuTrial, useDigitalMenuTrialStatus } from "@/hooks/use-commerce";
import { useSubscription } from "@/hooks/use-subscription";
import { ApiError } from "@/lib/api";
import { hasScope } from "@/lib/auth-user";
import { calculateTrialDaysRemaining } from "@/lib/commerce";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { formatPackagePrice } from "@/lib/package-display";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";

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
  const trial = useDigitalMenuTrialStatus();
  const subscription = useSubscription();
  const { data: accessProfile, isLoading: accessLoading } = useAccessProfile();
  const { menuQrs, loading: menusLoading } = useDigitalMenuOptions();
  const [startingTrial, setStartingTrial] = useState(false);
  const status = trial.data?.status ?? "NOT_STARTED";
  const activeTrial = status === "ACTIVE";
  const expiredTrial = status === "TRIAL_EXPIRED";
  const canUseDigitalMenu = hasScope(accessProfile, "QR_MENU_OWNER");
  const menuPackage = subscription.data?.packages.find((pkg) =>
    pkg.items?.some((item) => item.productCode === "QR_MENU"),
  );
  const packageId = trial.data?.packageId ?? menuPackage?.id ?? null;
  const packageName = trial.data?.packageName ?? menuPackage?.name ?? "Dijital Menü PRO";
  const price = trial.data?.price ?? menuPackage?.price ?? null;
  const currency = trial.data?.currency ?? menuPackage?.currency ?? "TRY";
  const daysRemaining = trial.data ? calculateTrialDaysRemaining(trial.data) : null;

  const startTrial = async () => {
    setStartingTrial(true);
    try {
      await getSiteSameOriginAxios().post("/trials/digital-menu-pro");
      await getSiteSameOriginAxios().post("/auth/refresh");
      await Promise.all([
        invalidateDigitalMenuTrial(queryClient),
        invalidateAccessProfile(queryClient),
      ]);
      notify("info", "Dijital Menü PRO deneme süreniz başlatıldı.");
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Deneme süresi başlatılamadı.");
    } finally {
      setStartingTrial(false);
    }
  };

  const openCheckout = () => {
    router.push(
      packageId == null
        ? DASHBOARD_ROUTES.accountSubscription
        : DASHBOARD_ROUTES.digitalMenuCheckout(packageId),
    );
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
          </div>
          <Button onClick={() => router.push(DASHBOARD_ROUTES.digitalMenuCreate)}>Menü QR Oluştur</Button>
        </div>

        {activeTrial && (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <Clock3 className="h-4 w-4 text-emerald-600" />
            <p className="text-sm text-muted-foreground">
              PRO denemeniz aktif
              {daysRemaining != null ? ` — ${daysRemaining} gün kaldı` : ""}.
            </p>
          </div>
        )}

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
              <Button className="mt-4" onClick={() => router.push(DASHBOARD_ROUTES.digitalMenuCreate)}>
                İlk menüyü oluştur
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {menuQrs.map((menuQr) => (
                <div key={menuQr.id} className="space-y-3 rounded-lg border border-border bg-card p-4">
                  <div>
                    <p className="font-medium text-foreground">{menuQr.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {String(menuQr.details.businessName ?? "Menü QR")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5" asChild>
                      <Link href={DASHBOARD_ROUTES.digitalMenuEdit(menuQr.id)}>
                        <Package className="h-3.5 w-3.5" />
                        Düzenle
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" asChild>
                      <Link href={`${DASHBOARD_ROUTES.digitalMenuCategories}?qr=${menuQr.id}`}>
                        <FolderTree className="h-3.5 w-3.5" />
                        Kategoriler
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" asChild>
                      <Link href={`${DASHBOARD_ROUTES.digitalMenuProducts}?qr=${menuQr.id}`}>
                        Ürünler
                      </Link>
                    </Button>
                  </div>
                </div>
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
        <p className="text-sm text-muted-foreground">Dijital menü için PRO paket gerekir.</p>
      </div>

      <Card className="glow-card overflow-hidden border-primary/30">
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-[1.15fr_.85fr]">
            <div className="space-y-6 p-6 lg:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <UtensilsCrossed className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold">{packageName}</h2>
                      <Crown className="h-4 w-4 text-amber-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">Canlı ve güncel profesyonel menü paketi</p>
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">PRO</span>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2">
                {FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              {expiredTrial && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Deneme süreniz sona erdi</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PRO özelliklerine devam etmek için paketi satın alın.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center gap-5 border-t border-border bg-muted/30 p-6 lg:border-l lg:border-t-0 lg:p-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dijital Menü PRO</p>
                <p className="mt-2 text-3xl font-bold">
                  {price == null ? "Güncel fiyat" : formatPackagePrice(price, currency)}
                </p>
                {menuPackage?.validityDays ? (
                  <p className="text-sm text-muted-foreground">/{menuPackage.validityDays} gün</p>
                ) : null}
              </div>

              {trial.isLoading ? (
                <Button disabled className="w-full gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Durum yükleniyor
                </Button>
              ) : (
                <div className="space-y-3">
                  {!expiredTrial && (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={startingTrial}
                      onClick={() => void startTrial()}
                    >
                      {startingTrial ? "Başlatılıyor…" : "Ücretsiz Denemeyi Başlat"}
                    </Button>
                  )}
                  <Button variant="hero" className="w-full" onClick={openCheckout}>
                    {expiredTrial ? "PRO Satın Al" : "Şimdi Satın Al"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
