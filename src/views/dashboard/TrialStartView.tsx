"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import {
  invalidateDigitalMenuTrial,
  startTrialRequest,
  useTrialStatus,
} from "@/hooks/use-commerce";
import { useActivePackages, useSubscription } from "@/hooks/use-subscription";
import { ApiError } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { filterCatalogPackages, formatPackageDate } from "@/lib/package-display";
import { refreshAccessAfterEntitlementChange } from "@/lib/refresh-access";
import {
  clearPersistedTrialIntent,
  DEFAULT_TRIAL_PACKAGE,
  readPersistedTrialPackage,
  readTrialPackageFromSearch,
  resolveTrialPackageId,
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

  const activePaidPurchase = useMemo(() => {
    const purchase = subscription.data?.activePurchase;
    if (!purchase?.usable || purchase.expired) return null;
    if (purchase.purchaseType !== "PAID") return null;
    if (purchase.packageCode === "FREE_PACKAGE") return null;
    return purchase;
  }, [subscription.data?.activePurchase]);

  useEffect(() => {
    clearPersistedTrialIntent();
  }, []);

  useEffect(() => {
    if (handledRef.current) return;
    if (trialStatus.isLoading || subscription.isLoading || packagesQuery.isLoading) return;

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
      window.setTimeout(() => router.replace(DASHBOARD_ROUTES.digitalMenuCreate), REDIRECT_DELAY_MS);
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
      router.replace(DASHBOARD_ROUTES.digitalMenuCreate);
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
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Deneme durumunuz kontrol ediliyor…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Ultimate&apos;i 30 gün ücretsiz başlat
        </h1>
        <p className="text-sm text-muted-foreground">
          Kredi kartı gerekmez. {trialPackage?.name ?? "Ultimate"} paketinin tüm özelliklerini 30 gün
          boyunca deneyin.
        </p>
      </div>

      <div className="rounded-lg border border-[hsl(var(--chart-violet)/0.35)] bg-gradient-to-b from-[hsl(var(--chart-violet)/0.14)] via-[hsl(var(--chart-violet)/0.06)] to-transparent p-5">
        <p className="text-sm font-medium text-foreground">
          {trialPackage?.name ?? "Ultimate"} · 30 gün ücretsiz
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Deneme süresince dijital menü, akıllı araçlar ve raporlamayı kullanabilirsiniz.
        </p>
      </div>

      <Button
        variant="hero"
        size="lg"
        className="w-full gap-2"
        disabled={phase === "starting"}
        onClick={() => void handleStartTrial()}
      >
        {phase === "starting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Başlatılıyor…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 text-[hsl(var(--chart-violet))]" />
            30 gün ücretsiz dene
          </>
        )}
      </Button>
    </div>
  );
}
