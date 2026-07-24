"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Minus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEligibleTrialPackages } from "@/hooks/use-commerce";
import { useActivePackages, useSubscription } from "@/hooks/use-subscription";
import type { PlanPackageApiItem } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  buildPackageComparisonRows,
  diffPackages,
  formatDaysUntilExpiry,
  formatPackageDate,
  formatPackagePrice,
  packageFeatures,
  planActionLabel,
  purchaseTypeLabel,
} from "@/lib/package-display";
import { cn } from "@/lib/utils";

function sortedPackages(packages: PlanPackageApiItem[]): PlanPackageApiItem[] {
  return [...packages].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
}

export default function PackageComparisonView() {
  const searchParams = useSearchParams();
  const highlight = searchParams.get("highlight");
  const subscription = useSubscription();
  const packagesQuery = useActivePackages();
  const eligibleTrials = useEligibleTrialPackages();
  const [focusedId, setFocusedId] = useState<number | null>(null);

  const current = subscription.data?.activePurchase ?? null;
  const packages = useMemo(
    () => sortedPackages((packagesQuery.data ?? []).filter((pkg) => pkg.active !== false)),
    [packagesQuery.data],
  );
  const rows = useMemo(() => buildPackageComparisonRows(packages), [packages]);
  const focusedPackage = packages.find((pkg) => pkg.id === focusedId) ?? null;
  const currentCatalog = packages.find((pkg) => pkg.id === current?.packageId) ?? null;
  const diff = focusedPackage ? diffPackages(currentCatalog, focusedPackage) : null;
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

  const ctaHref = (pkg: PlanPackageApiItem) => {
    if (current?.packageId === pkg.id) return null;
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
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-[640px] w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="sticky left-0 z-10 bg-muted/40 px-4 py-3 text-left font-medium text-muted-foreground">
                  Özellik
                </th>
                {packages.map((pkg) => {
                  const isCurrent = current?.packageId === pkg.id;
                  const menuHighlight = highlight === "QR_MENU";
                  const hasMenu = pkg.items?.some((i) => i.productCode === "QR_MENU");
                  return (
                    <th
                      key={pkg.id}
                      className={cn(
                        "min-w-[160px] px-4 py-3 text-left align-bottom",
                        isCurrent && "bg-primary/5",
                        menuHighlight && hasMenu && "ring-1 ring-inset ring-primary/30",
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
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
                            /{pkg.validityDays} gün
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
                  <td className="sticky left-0 z-10 bg-card px-4 py-3 font-medium text-foreground">
                    {row.label}
                  </td>
                  {packages.map((pkg) => (
                    <td
                      key={`${row.id}-${pkg.id}`}
                      className={cn(
                        "px-4 py-3 text-muted-foreground",
                        current?.packageId === pkg.id && "bg-primary/5 text-foreground",
                      )}
                    >
                      {row.values[String(pkg.id)] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="sticky left-0 z-10 bg-card px-4 py-4" />
                {packages.map((pkg) => {
                  const label = planActionLabel(current?.packageId, pkg, current?.price);
                  const href = ctaHref(pkg);
                  const showTrial =
                    isFreeOrTrial &&
                    trialEligibleIds.has(pkg.id) &&
                    eligibleTrials.data?.some((t) => t.id === pkg.id);
                  return (
                    <td key={`cta-${pkg.id}`} className="px-4 py-4 align-top">
                      <div className="space-y-2">
                        {label === "Mevcut plan" || !href ? (
                          <Button className="w-full" variant="outline" disabled>
                            Mevcut plan
                          </Button>
                        ) : (
                          <Button
                            className="w-full"
                            variant={label === "Yükselt" || label === "Satın al" ? "hero" : "outline"}
                            asChild
                            onMouseEnter={() => setFocusedId(pkg.id)}
                            onFocus={() => setFocusedId(pkg.id)}
                          >
                            <Link href={href}>{label}</Link>
                          </Button>
                        )}
                        {showTrial ? (
                          <p className="text-[11px] text-muted-foreground">
                            Deneme için Dijital Menü veya Abonelik ekranından başlatabilirsiniz.
                          </p>
                        ) : null}
                        <button
                          type="button"
                          className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                          onClick={() => setFocusedId(pkg.id)}
                        >
                          Ne değişir?
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {focusedPackage && diff ? (
        <Card className="glow-card">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ne değişir?
              </p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">
                {currentCatalog?.name ?? "Mevcut"} → {focusedPackage.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {diff.direction === "upgrade"
                  ? "Yükseltme"
                  : diff.direction === "downgrade"
                    ? "Düşürme"
                    : "Aynı seviye"}
                {diff.priceDelta !== 0
                  ? ` · Fiyat farkı ${diff.priceDelta > 0 ? "+" : ""}${formatPackagePrice(Math.abs(diff.priceDelta), focusedPackage.currency)}`
                  : ""}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="mb-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">Kazanılanlar</p>
                <ul className="space-y-1.5">
                  {(diff.gained.length ? diff.gained : ["Ek yeni özellik yok"]).map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-amber-700 dark:text-amber-400">Kaybedilenler</p>
                <ul className="space-y-1.5">
                  {(diff.lost.length ? diff.lost : ["Kayıp yok"]).map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Aynı kalanlar</p>
                <ul className="space-y-1.5">
                  {(diff.same.length ? diff.same.slice(0, 5) : ["—"]).map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {packageFeatures(focusedPackage).map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
