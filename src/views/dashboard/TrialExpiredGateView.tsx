"use client";

import Link from "next/link";
import { CreditCard, Sparkles } from "lucide-react";

import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

export default function TrialExpiredGateView() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg space-y-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <BrandLogo size="lg" />
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
            Deneme süresi sona erdi
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Deneme sürümünüz bitti
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            15 günlük Ultimate denemeniz tamamlandı. Memnun kaldıysanız kredi kartı ekleyip size
            uygun paketi seçerek gelişmiş özelliklerle devam edebilirsiniz.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button variant="hero" size="lg" className="w-full gap-2" asChild>
            <Link href={DASHBOARD_ROUTES.accountPackages}>
              <Sparkles className="h-4 w-4" />
              Paket seç ve devam et
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="w-full gap-2" asChild>
            <Link href={DASHBOARD_ROUTES.accountPaymentMethods}>
              <CreditCard className="h-4 w-4" />
              Kart ekle
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
