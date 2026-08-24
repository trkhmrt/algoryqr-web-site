"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useDigitalMenuAccess } from "@/components/dashboard/menu/DigitalMenuPicker";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
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
      <Link
        href={DASHBOARD_ROUTES.integrations}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Entegrasyonlar
      </Link>

      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Yemek Sepeti</h1>
          <p className="text-sm text-muted-foreground">
            Yemek Sepeti hesabınızdaki siparişleri takip edin ve menünüzü senkronize edin.
          </p>
        </div>
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
