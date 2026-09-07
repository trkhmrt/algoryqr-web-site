"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Hotel, Sparkles, Store, UtensilsCrossed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { useMyProfile } from "@/hooks/use-my-profile";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { DASHBOARD_PANEL } from "@/lib/dashboard-surface";
import { cn } from "@/lib/utils";
import {
  BUSINESS_TYPE_OPTIONS,
  isWelcomeOnboardingDone,
  markWelcomeOnboardingDone,
  type BusinessType,
} from "@/lib/welcome-onboarding";

const FEATURE_CARDS = [
  {
    title: "Dijital menü ve QR",
    body: "Şubenize menü bağlayıp QR ile yayınlayın; müşterileriniz anında erişir.",
  },
  {
    title: "Garson ve sipariş",
    body: "Ultimate denemede garson paneli, masa ve adisyon araçlarını deneyin.",
  },
  {
    title: "Akıllı asistan ve AI",
    body: "Menü fotoğrafından ürün çıkarma ve akıllı asistan ile kurulumu hızlandırın.",
  },
] as const;

const BUSINESS_ICONS = {
  restaurant: UtensilsCrossed,
  cafe: Coffee,
  hotel: Hotel,
  other: Store,
} as const;

type Step = "business" | "features";

export default function WelcomeOnboardingView() {
  const router = useRouter();
  const profile = useMyProfile();
  const userId = profile.data?.userId ?? null;
  const [step, setStep] = useState<Step>("business");
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);

  useEffect(() => {
    if (profile.isLoading) return;
    if (userId != null && isWelcomeOnboardingDone(userId)) {
      router.replace(DASHBOARD_ROUTES.overview);
    }
  }, [profile.isLoading, router, userId]);

  const finish = (selected?: BusinessType | null) => {
    if (userId != null) {
      markWelcomeOnboardingDone(userId, selected ?? businessType);
    }
    router.replace(DASHBOARD_ROUTES.overview);
  };

  const progressLabel = useMemo(
    () => (step === "business" ? "1 / 2" : "2 / 2"),
    [step],
  );

  if (profile.isLoading || (userId != null && isWelcomeOnboardingDone(userId))) {
    return <DashboardLoadingState label="Yönlendiriliyor…" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 animate-fade-in py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Karşılama · {progressLabel}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {step === "business" ? "İşletmeniz ne tür?" : "Ultimate denemenizde neler var?"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === "business"
              ? "Size daha uygun öneriler için bir tip seçin. İstediğiniz zaman atlayabilirsiniz."
              : "15 gün boyunca Ultimate özelliklerini ücretsiz kullanın. Kuruluma dilediğiniz zaman geçin."}
          </p>
        </div>
        <Button variant="ghost" className="shrink-0 text-muted-foreground" onClick={() => finish()}>
          Atla
        </Button>
      </div>

      {step === "business" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {BUSINESS_TYPE_OPTIONS.map((option) => {
            const Icon = BUSINESS_ICONS[option.id];
            const selected = businessType === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setBusinessType(option.id)}
                className={cn(
                  DASHBOARD_PANEL,
                  "flex items-start gap-3 text-left transition-colors",
                  selected
                    ? "border-primary/40 bg-primary/10"
                    : "hover:border-border hover:bg-muted/40",
                )}
              >
                <span className="mt-0.5 rounded-lg border border-border/60 bg-background p-2">
                  <Icon className="h-4 w-4 text-foreground" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-foreground">{option.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{option.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3">
          {FEATURE_CARDS.map((card) => (
            <div key={card.title} className={`${DASHBOARD_PANEL} flex items-start gap-3`}>
              <span className="mt-0.5 rounded-lg border border-primary/20 bg-primary/10 p-2">
                <Sparkles className="h-4 w-4 text-primary" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{card.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {step === "features" ? (
          <Button variant="outline" onClick={() => setStep("business")}>
            Geri
          </Button>
        ) : null}
        {step === "business" ? (
          <Button
            variant="hero"
            disabled={!businessType}
            onClick={() => setStep("features")}
          >
            Devam
          </Button>
        ) : (
          <Button variant="hero" onClick={() => finish(businessType)}>
            Panele geç
          </Button>
        )}
      </div>
    </div>
  );
}
