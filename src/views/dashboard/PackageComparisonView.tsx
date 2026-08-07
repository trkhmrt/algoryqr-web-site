"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, CircleHelp, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEligibleTrialPackages } from "@/hooks/use-commerce";
import { useActivePackages, useSubscription } from "@/hooks/use-subscription";
import type { PlanPackageApiItem } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  buildPackageComparisonRows,
  featureTooltip,
  formatDaysUntilExpiry,
  formatPackageDate,
  formatPackagePrice,
  planActionLabel,
  purchaseTypeLabel,
} from "@/lib/package-display";
import { matchesProductCode } from "@/lib/product-access";
import { cn } from "@/lib/utils";

function sortedPackages(packages: PlanPackageApiItem[]): PlanPackageApiItem[] {
  return [...packages].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
}

function ComparisonCellValue({ value }: { value: string }) {
  if (value === "Var") {
    return (
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600"
        aria-label="Var"
      >
        <Check className="h-3 w-3 text-white" strokeWidth={3} />
      </span>
    );
  }
  if (value === "Yok") {
    return (
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600"
        aria-label="Yok"
      >
        <X className="h-3 w-3 text-white" strokeWidth={3} />
      </span>
    );
  }
  return <>{value}</>;
}

export default function PackageComparisonView() {
  const searchParams = useSearchParams();
  const highlight = searchParams.get("highlight");
  const subscription = useSubscription();
  const packagesQuery = useActivePackages();
  const eligibleTrials = useEligibleTrialPackages();

  const current = subscription.data?.activePurchase ?? null;
  const packages = useMemo(
    () => sortedPackages((packagesQuery.data ?? []).filter((pkg) => pkg.active !== false)),
    [packagesQuery.data],
  );
  const rows = useMemo(() => buildPackageComparisonRows(packages), [packages]);
  const trialEligibleIds = new Set((eligibleTrials.data ?? []).map((pkg) => pkg.id));
  const isPaidActive =
    !!current &&
    current.usable &&
    !current.expired &&
    current.purchaseType === "PAID" &&
    current.packageCode !== "FREE_PACKAGE";
  const isFreeOrTrial =
    !!current &&
    current.usable &&
    !current.expired &&
    (current.purchaseType === "TRIAL" || current.packageCode === "FREE_PACKAGE");
  const featureColPct = 28;
  const packageColPct = packages.length > 0 ? (100 - featureColPct) / packages.length : 0;

  const ctaHref = (pkg: PlanPackageApiItem) => {
    if (pkg.code === "FREE_PACKAGE" && current?.packageId !== pkg.id) {
      return null;
    }
    if (current?.packageId === pkg.id) {
      if (current.purchaseType === "TRIAL") {
        return DASHBOARD_ROUTES.accountSubscriptionCheckout(pkg.id);
      }
      return null;
    }
    if (isPaidActive) return DASHBOARD_ROUTES.accountPlanChange(pkg.id);
    return DASHBOARD_ROUTES.accountSubscriptionCheckout(pkg.id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href={DASHBOARD_ROUTES.accountSubscription}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Paketler</h1>
          <p className="text-sm text-muted-foreground">
            Mevcut planınızı diğer paketlerle yan yana karşılaştırın.
          </p>
        </div>
      </div>

      <Card className="glow-card border-primary/20">
        <CardContent className="p-5 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Şu an bunu kullanıyorsunuz
          </p>
          {subscription.isLoading ? (
            <div className="h-12 animate-pulse rounded-md bg-muted" />
          ) : current ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">{current.packageName}</h2>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {purchaseTypeLabel(current.purchaseType)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {subscription.data?.usage.unlimited
                  ? "Sınırsız QR hakkı"
                  : `${subscription.data?.usage.remaining ?? 0} QR hakkı kaldı`}
                {current.expiresAt
                  ? ` · Bitiş ${formatPackageDate(current.expiresAt)} · ${formatDaysUntilExpiry(current.daysUntilExpiry)}`
                  : ""}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Aktif paket bilgisi bulunamadı.</p>
          )}
        </CardContent>
      </Card>

      {packagesQuery.isLoading ? (
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      ) : packages.length === 0 ? (
        <p className="text-sm text-muted-foreground">Karşılaştırılacak paket bulunamadı.</p>
      ) : (
        <TooltipProvider delayDuration={200}>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-[720px] w-full table-fixed border-collapse text-sm">
              <colgroup>
                <col style={{ width: `${featureColPct}%` }} />
                {packages.map((pkg) => (
                  <col key={`col-${pkg.id}`} style={{ width: `${packageColPct}%` }} />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="sticky left-0 z-10 bg-muted/40 px-4 py-3 text-left font-medium text-muted-foreground">
                    Ürün
                  </th>
                  {packages.map((pkg) => {
                    const isCurrent = current?.packageId === pkg.id;
                    const highlightMatch =
                      !!highlight &&
                      pkg.items?.some((item) => matchesProductCode(item.productCode, highlight));
                    return (
                      <th
                        key={pkg.id}
                        className={cn(
                          "px-4 py-3 text-center align-bottom",
                          isCurrent && "bg-primary/5",
                          highlightMatch && "ring-1 ring-inset ring-primary/30",
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            <span className="font-semibold text-foreground">{pkg.name}</span>
                            {isCurrent ? (
                              <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                Mevcut
                              </span>
                            ) : null}
                          </div>
                          <p className="text-base font-bold text-foreground">
                            {formatPackagePrice(pkg.price, pkg.currency)}
                          </p>
                          {pkg.validityDays ? (
                            <p className="text-xs font-normal text-muted-foreground">
                              {pkg.validityDays === 30 ? "aylık" : `/${pkg.validityDays} gün`}
                            </p>
                          ) : null}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/70">
                    <td className="sticky left-0 z-10 bg-card px-4 py-3 text-left font-medium text-foreground break-words">
                      <span className="inline-flex items-center gap-1.5">
                        <span>{row.label}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                              aria-label={`${row.label} açıklaması`}
                            >
                              <CircleHelp className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs">
                            {featureTooltip(row.label)}
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </td>
                    {packages.map((pkg) => (
                      <td
                        key={`${row.id}-${pkg.id}`}
                        className={cn(
                          "px-4 py-3 text-center text-muted-foreground break-words",
                          current?.packageId === pkg.id && "bg-primary/5 text-foreground",
                        )}
                      >
                        <span className="inline-flex items-center justify-center">
                          <ComparisonCellValue value={row.values[String(pkg.id)] ?? "—"} />
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="sticky left-0 z-10 bg-card px-4 py-4" />
                  {packages.map((pkg) => {
                    const label = planActionLabel(
                      current?.packageId,
                      pkg,
                      current?.price,
                      current?.purchaseType,
                    );
                    const href = ctaHref(pkg);
                    const showTrial =
                      isFreeOrTrial &&
                      current?.packageId !== pkg.id &&
                      trialEligibleIds.has(pkg.id) &&
                      eligibleTrials.data?.some((t) => t.id === pkg.id);
                    return (
                      <td key={`cta-${pkg.id}`} className="px-4 py-4 align-top text-center">
                        <div className="mx-auto max-w-[220px] space-y-2">
                          {label === "Mevcut plan" ? (
                            <Button className="w-full" variant="outline" disabled>
                              Mevcut plan
                            </Button>
                          ) : label && href ? (
                            <Button
                              className="w-full"
                              variant={label === "Yükselt" || label === "Satın al" ? "hero" : "outline"}
                              asChild
                            >
                              <Link href={href}>{label}</Link>
                            </Button>
                          ) : null}
                          {showTrial ? (
                            <p className="text-[11px] text-muted-foreground">
                              Deneme için Dijital Menü veya Abonelik ekranından başlatabilirsiniz.
                            </p>
                          ) : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
