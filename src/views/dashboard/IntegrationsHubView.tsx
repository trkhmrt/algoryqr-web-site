"use client";

import Link from "next/link";
import Image from "next/image";

import { UberEatsWordmarkSvg } from "@/components/icons/UberEatsWordmarkSvg";

import { useDigitalMenuAccess } from "@/components/dashboard/menu/DigitalMenuPicker";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { TGO_SOFT_CARD_CLASS } from "@/lib/trendyol-go-ui";

export default function IntegrationsHubView() {
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();

  if (accessLoading) {
    return null;
  }

  if (!canUseDigitalMenu) {
    return <p className="text-sm text-muted-foreground">Bu özellik dijital menü paketi gerektirir.</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Entegrasyonlar</h1>
        <p className="text-sm text-muted-foreground">
          Bağlamak istediğiniz platformu seçin.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={DASHBOARD_ROUTES.trendyolGo}
          aria-label="Uber Eats"
          className={`group flex items-center justify-center ${TGO_SOFT_CARD_CLASS} p-6 transition-colors hover:border-primary/30 sm:p-8`}
        >
          <UberEatsWordmarkSvg />
        </Link>

        <Link
          href={DASHBOARD_ROUTES.yemekSepeti}
          aria-label="Yemek Sepeti"
          className={`group relative flex items-center justify-center ${TGO_SOFT_CARD_CLASS} p-6 transition-colors hover:border-primary/30 sm:p-8`}
        >
          <span className="absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Yakında
          </span>
          <Image
            src="/yemek-sepeti/wordmark.png"
            alt="Yemek Sepeti"
            width={640}
            height={160}
            className="h-auto w-full max-w-[280px] object-contain"
          />
        </Link>
      </div>
    </div>
  );
}
