"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
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
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href={DASHBOARD_ROUTES.account}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ödeme geçmişi</h1>
          <p className="text-sm text-muted-foreground">Ödemeler, kart ve dönem bilgileri</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-lg border border-border bg-muted" />
      ) : isError ? (
        <p className="text-sm text-destructive">Ödeme geçmişi yüklenemedi.</p>
      ) : purchases.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz ödeme kaydı yok.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
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
                className="flex items-center justify-between gap-3 bg-card px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{title}</p>
                    {purchase.purchaseType ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {purchaseTypeLabel(purchase.purchaseType)}
                      </span>
                    ) : null}
                    {quantity ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
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
