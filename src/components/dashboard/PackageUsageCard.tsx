"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Clock3, Zap } from "lucide-react";
import type { PackageUsageSummary } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { formatDaysUntilExpiry, formatPackageDate } from "@/lib/package-display";

interface PackageUsageCardProps {
  usage: PackageUsageSummary | undefined;
  isLoading?: boolean;
}

const PackageUsageCard = ({ usage, isLoading }: PackageUsageCardProps) => {
  if (isLoading) {
    return (
      <Card className="glow-card">
        <CardContent className="p-5">
          <div className="h-16 animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!usage) return null;

  const usedPercent = usage.total > 0 ? Math.round((usage.used / usage.total) * 100) : 0;
  const activeLabel = usage.usable ? "Aktif paketiniz" : "Aktif paket yok";
  const isTrial = !!usage.isTrial;

  return (
    <Card className="glow-card">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Zap className="h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm font-medium text-foreground">{usage.packageName}</p>
              {isTrial ? (
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  Deneme
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeLabel} · {usage.unlimited ? "Sınırsız QR oluşturma" : `${usage.remaining} QR oluşturma hakkı kaldı`}
            </p>
            {usage.expiresAt ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Bitiş: {formatPackageDate(usage.expiresAt)} · {formatDaysUntilExpiry(usage.daysUntilExpiry)}
              </p>
            ) : null}
            {isTrial ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                <Clock3 className="h-3.5 w-3.5" />
                Deneme süreniz: {formatDaysUntilExpiry(usage.daysUntilExpiry)}
              </p>
            ) : null}
            {usage.paymentApproaching && usage.nextPaymentDueAt ? (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Ödeme yaklaşıyor: {formatPackageDate(usage.nextPaymentDueAt)}
              </p>
            ) : null}
            {!usage.paymentApproaching && usage.expiryApproaching ? (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Paket süreniz yakında doluyor
              </p>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {usage.unlimited ? "Sınırsız" : usage.remaining}
            </p>
            {!usage.unlimited && <p className="text-[11px] text-muted-foreground">/ {usage.total} hak</p>}
          </div>
        </div>
        {!usage.unlimited && (
          <div className="space-y-1.5">
            <Progress value={usedPercent} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground">
              {usage.used} kullanıldı · {usage.remaining} kalan
            </p>
          </div>
        )}
        {isTrial ? (
          <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
            <Link href={DASHBOARD_ROUTES.accountPackages}>Ücretli pakete geç</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default PackageUsageCard;
