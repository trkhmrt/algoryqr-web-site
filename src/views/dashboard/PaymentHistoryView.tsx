"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { DASHBOARD_BACK, DASHBOARD_SURFACE } from "@/lib/dashboard-surface";
import {
  formatPackageDate,
  formatPackagePrice,
  purchaseTypeLabel,
  addonProductLabel,
} from "@/lib/package-display";
import { useSubscription } from "@/hooks/use-subscription";
import { purchaseStatusLabel } from "@/lib/refund-display";

export default function PaymentHistoryView() {
  const { data, isLoading, isError } = useSubscription();
  const purchases = data?.purchases ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardPageHeader
        title="Ödeme geçmişi"
        hint="Ödemeler, kart ve dönem bilgileri"
        back={
          <Link href={DASHBOARD_ROUTES.account} aria-label="Hesaba dön" className={DASHBOARD_BACK}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

      {isLoading ? (
        <DashboardLoadingState label="Ödeme geçmişi yükleniyor…" />
      ) : isError ? (
        <p className="text-sm text-destructive">Ödeme geçmişi yüklenemedi.</p>
      ) : purchases.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz ödeme kaydı yok.</p>
      ) : (
        <div className={`${DASHBOARD_SURFACE} overflow-hidden divide-y divide-border`}>
          {purchases.map((purchase) => {
            const isAddon = purchase.purchaseType === "ADD_ON";
            const title = isAddon
              ? addonProductLabel(purchase.packageCode, purchase.packageName)
              : purchase.packageName;
            const quantity =
              isAddon && purchase.installmentCount && purchase.installmentCount > 0
                ? purchase.installmentCount
                : null;
            return (
              <Link
                key={purchase.id}
                href={DASHBOARD_ROUTES.accountPaymentHistoryDetail(purchase.id)}
                className="flex items-center justify-between gap-3 bg-white px-3 py-2.5 transition-colors hover:bg-muted/50 dark:bg-card"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{title}</p>
                    {purchase.purchaseType ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {purchaseTypeLabel(purchase.purchaseType)}
                      </span>
                    ) : null}
                    {quantity ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {quantity} adet
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatPackageDate(purchase.purchasedAt)}
                    {purchase.status ? ` · ${purchaseStatusLabel(purchase.status)}` : ""}
                    {purchase.paymentId ? ` · ${purchase.paymentId}` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium text-foreground">
                  {formatPackagePrice(purchase.price ?? 0, purchase.currency)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
