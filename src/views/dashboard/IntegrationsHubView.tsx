"use client";

import Link from "next/link";
import Image from "next/image";

import { UberEatsWordmarkSvg } from "@/components/icons/UberEatsWordmarkSvg";

import { useDigitalMenuAccess } from "@/components/dashboard/menu/DigitalMenuPicker";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DASHBOARD_TILE } from "@/lib/dashboard-surface";

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
      <DashboardPageHeader
        title="Entegrasyonlar"
        hint="Bağlamak istediğiniz platformu seçin."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href={DASHBOARD_ROUTES.uberEats}
          aria-label="Uber Eats"
          className={`group flex min-h-[10rem] items-center justify-center ${DASHBOARD_TILE} sm:p-8`}
        >
          <UberEatsWordmarkSvg />
        </Link>

        <Link
          href={DASHBOARD_ROUTES.yemekSepeti}
          aria-label="Yemek Sepeti"
          className={`group flex min-h-[10rem] items-center justify-center ${DASHBOARD_TILE} sm:p-8`}
        >
          <Image
            src="/yemek-sepeti/wordmark.png"
            alt="Yemek Sepeti"
            width={640}
            height={160}
            className="h-auto w-full max-w-[280px] object-contain"
          />
        </Link>
        <Link
          href={DASHBOARD_ROUTES.printer}
          aria-label="Fiş yazıcısı"
          className={`group flex min-h-[10rem] flex-col items-center justify-center gap-2 ${DASHBOARD_TILE} sm:p-8`}
        >
          <span className="text-lg font-semibold">Fiş yazıcısı</span>
          <span className="text-sm text-muted-foreground">Birch / ESC/POS otomatik basım</span>
        </Link>
      </div>
    </div>
  );
}
