"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { useDigitalMenuAccess } from "@/components/dashboard/menu/DigitalMenuPicker";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { DASHBOARD_BACK } from "@/lib/dashboard-surface";
import { TGO_SOFT_CARD_CLASS } from "@/lib/trendyol-go-ui";

export default function YemekSepetiHubView() {
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();

  if (accessLoading) {
    return null;
  }

  if (!canUseDigitalMenu) {
    return <p className="text-sm text-muted-foreground">Bu özellik dijital menü paketi gerektirir.</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardPageHeader
        title="Yemek Sepeti"
        hint="Yemek Sepeti hesabınızdaki siparişleri takip edin ve menünüzü senkronize edin."
        back={
          <Link
            href={DASHBOARD_ROUTES.integrations}
            aria-label="Entegrasyonlara dön"
            className={DASHBOARD_BACK}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

      <div className="space-y-3">
        <div className={`flex items-center justify-center ${TGO_SOFT_CARD_CLASS} p-6 sm:p-8`}>
          <Image
            src="/yemek-sepeti/wordmark.png"
            alt="Yemek Sepeti"
            width={640}
            height={160}
            className="h-auto w-full max-w-[320px] object-contain"
          />
        </div>
      </div>

      <div className={`${TGO_SOFT_CARD_CLASS} p-6 sm:p-8`}>
        <p className="text-sm font-medium text-foreground">Yakında</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Yemek Sepeti entegrasyonu üzerinde çalışıyoruz. Hazır olduğunda buradan bağlantı kurabileceksiniz.
        </p>
      </div>
    </div>
  );
}
