"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";

import { CardVerificationPanel } from "@/components/dashboard/CardVerificationPanel";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import {
  invalidateDigitalMenuTrial,
  invalidatePaymentMethods,
  startTrialRequest,
  usePaymentMethods,
  useTrialStatus,
} from "@/hooks/use-commerce";
import { useActivePackages, useSubscription } from "@/hooks/use-subscription";
import { ApiError } from "@/lib/api";
import { isActivePaidPurchase } from "@/lib/product-access";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { filterCatalogPackages, formatPackageDate } from "@/lib/package-display";
import { refreshAccessAfterEntitlementChange } from "@/lib/refresh-access";
import { DASHBOARD_PANEL } from "@/lib/dashboard-surface";
import {
  clearPersistedTrialIntent,
  DEFAULT_TRIAL_PACKAGE,
  readPersistedTrialPackage,
  readTrialPackageFromSearch,
  resolveTrialPackageId,
  buildTrialStartUrl,
} from "@/lib/trial-flow";

const REDIRECT_DELAY_MS = 4000;

type HubPhase = "loading" | "confirm" | "starting" | "blocked";

export default function TrialStartView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const handledRef = useRef(false);

  const packageCode = useMemo(() => {
    const fromQuery = readTrialPackageFromSearch(searchParams, readPersistedTrialPackage());
    return fromQuery || DEFAULT_TRIAL_PACKAGE;
  }, [searchParams]);

  const trialStatus = useTrialStatus();
  const subscription = useSubscription();
  const packagesQuery = useActivePackages();
  const paymentMethods = usePaymentMethods();
  const hasCard = (paymentMethods.data?.length ?? 0) > 0;
  const verification = searchParams.get("verification");

  const [phase, setPhase] = useState<HubPhase>("loading");

  const packages = useMemo(
    () => filterCatalogPackages(packagesQuery.data ?? []),
    [packagesQuery.data],
  );
  const packageId = useMemo(
    () => resolveTrialPackageId(packages, packageCode),
    [packages, packageCode],
  );
  const trialPackage = useMemo(
    () => packages.find((pkg) => pkg.id === packageId) ?? null,
    [packages, packageId],
  );

  const activePaidPurchase = useMemo(
    () => (isActivePaidPurchase(subscription.data?.activePurchase ?? null) ? subscription.data?.activePurchase ?? null : null),
    [subscription.data?.activePurchase],
  );

  useEffect(() => {
    clearPersistedTrialIntent();
  }, []);

  useEffect(() => {
    if (verification !== "success") return;
    void invalidatePaymentMethods(queryClient);
  }, [queryClient, verification]);

  useEffect(() => {
    if (handledRef.current) return;
    if (trialStatus.isLoading || subscription.isLoading || packagesQuery.isLoading || paymentMethods.isLoading) {
      return;
    }

    if (trialStatus.isError || packagesQuery.isError) {
      setPhase("blocked");
      return;
    }

    if (packageId == null) {
      handledRef.current = true;
      notify("danger", "Deneme paketi bulunamadı.");
      window.setTimeout(() => router.replace(DASHBOARD_ROUTES.accountPackages), REDIRECT_DELAY_MS);
      setPhase("blocked");
      return;
    }

    if (activePaidPurchase) {
      handledRef.current = true;
      notify("warning", "Aktif paketiniz bulunmaktadır.");
      window.setTimeout(() => router.replace(DASHBOARD_ROUTES.overview), REDIRECT_DELAY_MS);
      setPhase("blocked");
      return;
    }

    const status = trialStatus.data?.status ?? "NOT_STARTED";

    if (status === "TRIAL_EXPIRED") {
      handledRef.current = true;
      notify("warning", "Deneme hakkınız bitmiştir.");
      window.setTimeout(() => router.replace(DASHBOARD_ROUTES.accountPackages), REDIRECT_DELAY_MS);
      setPhase("blocked");
      return;
    }

    if (status === "ACTIVE") {
      handledRef.current = true;
      notify("info", "Denemeniz devam ediyor.");
      window.setTimeout(() => router.replace(DASHBOARD_ROUTES.branchCreate), REDIRECT_DELAY_MS);
      setPhase("blocked");
      return;
    }

    setPhase("confirm");
  }, [
    activePaidPurchase,
    notify,
    packageId,
    packagesQuery.isError,
    packagesQuery.isLoading,
    paymentMethods.isLoading,
    router,
    subscription.isLoading,
    trialStatus.data?.status,
    trialStatus.isError,
    trialStatus.isLoading,
  ]);

  const handleStartTrial = async () => {
    if (packageId == null || phase !== "confirm") return;
    setPhase("starting");
    try {
      const started = await startTrialRequest(packageId);
      await refreshAccessAfterEntitlementChange(queryClient);
      await invalidateDigitalMenuTrial(queryClient);
      notify(
        "info",
        `${started.packageName ?? trialPackage?.name ?? "Ultimate"} denemeniz başlatıldı` +
          (started.trialEndsAt ? ` · bitiş: ${formatPackageDate(started.trialEndsAt)}` : "") +
          ".",
      );
      router.replace(DASHBOARD_ROUTES.branchCreate);
    } catch (error) {
      setPhase("confirm");
      const message = error instanceof ApiError ? error.message : "Deneme süresi başlatılamadı.";
      if (/deneme hakki|deneme hakk/i.test(message)) {
        notify("warning", "Deneme hakkınız bitmiştir.");
        window.setTimeout(() => router.replace(DASHBOARD_ROUTES.accountPackages), REDIRECT_DELAY_MS);
        return;
      }
      if (/ucretli paket|ücretli paket/i.test(message)) {
        notify("warning", "Aktif paketiniz bulunmaktadır.");
        window.setTimeout(() => router.replace(DASHBOARD_ROUTES.overview), REDIRECT_DELAY_MS);
        return;
      }
      notify("danger", message);
    }
  };

  if (phase === "loading" || phase === "blocked") {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 animate-fade-in">
        <DashboardPageHeader
          title="Ultimate'i 30 gün ücretsiz başlat"
          hint="Deneme durumunuz kontrol ediliyor…"
        />
        <DashboardLoadingState label="Deneme durumunuz kontrol ediliyor…" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 animate-fade-in">
      <DashboardPageHeader
        title="Ultimate'i 30 gün ücretsiz başlat"
        hint={`${trialPackage?.name ?? "Ultimate"} paketini 30 gün ücretsiz kullanın. Kart zorunludur; deneme bitince kayıtlı karttan çekim yapılır.`}
      />

      <div className={`${DASHBOARD_PANEL} border-primary/35 bg-gradient-to-b from-primary/12 via-primary/6 to-transparent`}>
        <p className="text-sm font-medium text-foreground">
          {trialPackage?.name ?? "Ultimate"} · 30 gün ücretsiz
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Deneme süresince dijital menü, akıllı araçlar ve raporlamayı kullanabilirsiniz. İlk 1 TL
          doğrulama iade edilir.
        </p>
      </div>

      {hasCard ? null : (
        <CardVerificationPanel returnPath={buildTrialStartUrl(packageCode)} />
      )}

      <Button
        variant="hero"
        size="lg"
        className="w-full gap-2"
        disabled={phase === "starting" || !hasCard}
        onClick={() => void handleStartTrial()}
      >
        {phase === "starting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Başlatılıyor…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            30 gün ücretsiz dene
          </>
        )}
      </Button>
    </div>
  );
}
