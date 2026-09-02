"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, MailCheck, Sparkles } from "lucide-react";

import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import {
  invalidateDigitalMenuTrial,
  invalidatePaymentMethods,
  startTrialRequest,
  useTrialStatus,
} from "@/hooks/use-commerce";
import { useActivePackages, useSubscription } from "@/hooks/use-subscription";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";
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
  const verification = searchParams.get("verification");

  const [phase, setPhase] = useState<HubPhase>("loading");
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [emailCode, setEmailCode] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    void getSiteSameOriginAxios()
      .get<{ verified: boolean }>("/account/email-verification/status")
      .then(({ data }) => setEmailVerified(data.verified))
      .catch(() => setEmailVerified(null));
  }, []);

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
    if (trialStatus.isLoading || subscription.isLoading || packagesQuery.isLoading || emailVerified === null) {
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
    emailVerified,
    router,
    subscription.isLoading,
    trialStatus.data?.status,
    trialStatus.isError,
    trialStatus.isLoading,
  ]);

  const handleStartTrial = async () => {
    if (packageId == null || phase !== "confirm" || emailVerified !== true) return;
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

  const sendVerificationCode = async () => {
    setEmailSending(true);
    setEmailError(null);
    try {
      await getSiteSameOriginAxios().post("/account/email-verification/request-code", {});
      notify("info", "Doğrulama kodu e-posta adresinize gönderildi.");
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "Kod gönderilemedi.");
    } finally {
      setEmailSending(false);
    }
  };

  const verifyEmail = async () => {
    setEmailSending(true);
    setEmailError(null);
    try {
      await getSiteSameOriginAxios().post("/account/email-verification/verify", { code: emailCode });
      setEmailVerified(true);
      notify("info", "E-posta adresiniz doğrulandı.");
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "Kod doğrulanamadı.");
    } finally {
      setEmailSending(false);
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
          hint={`${trialPackage?.name ?? "Ultimate"} paketini 30 gün ücretsiz kullanın. Deneme için kart zorunlu değildir.`}
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

      {emailVerified !== true && (
        <div className={`${DASHBOARD_PANEL} space-y-3`}>
          <div className="flex items-center gap-2 font-medium"><MailCheck className="h-4 w-4" /> E-posta doğrulaması gerekli</div>
          <p className="text-xs text-muted-foreground">Denemeyi başlatmak için e-posta adresinize gelen 6 haneli kodu girin.</p>
          <div className="flex gap-2">
            <input className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm" value={emailCode} onChange={(event) => setEmailCode(event.target.value)} placeholder="6 haneli kod" maxLength={6} />
            <Button variant="outline" onClick={() => void verifyEmail()} disabled={emailSending || emailCode.length !== 6}>Doğrula</Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => void sendVerificationCode()} disabled={emailSending}>Kodu tekrar gönder</Button>
          {emailError && <p className="text-xs text-destructive">{emailError}</p>}
        </div>
      )}

      <Button
        variant="hero"
        size="lg"
        className="w-full gap-2"
        disabled={phase === "starting" || emailVerified !== true}
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
