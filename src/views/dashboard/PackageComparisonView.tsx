"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Sparkles, X } from "lucide-react";

import {
  PackageComparisonCurrentPlanSkeleton,
  PackageComparisonSkeleton,
} from "@/components/dashboard/PackageComparisonSkeleton";
import { Button } from "@/components/ui/button";
import { FeatureHintByProduct } from "@/components/ui/FeatureHint";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePackageCatalog } from "@/hooks/use-package-catalog";
import type { PlanPackageApiItem } from "@/lib/api";
import type { BillingPeriod } from "@/lib/commerce";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  formatDaysUntilExpiry,
  formatPackageDate,
  formatPackagePrice,
  formatYearlySavingsBadge,
  formatYearlySavingsLabel,
  planActionLabel,
  resolveYearlySavingsPercent,
  purchaseTypeLabel,
  resolvePackagePricing,
  type PackagePricing,
} from "@/lib/package-display";
import { matchesProductCode } from "@/lib/product-access";
import { cn } from "@/lib/utils";

function ComparisonCellValue({ value }: { value: string }) {
  if (value === "Var") {
    return (
      <span
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600"
        aria-label="Var"
      >
        <Check className="h-3 w-3 text-white" strokeWidth={3} />
      </span>
    );
  }
  if (value === "Yok") {
    return (
      <span
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600"
        aria-label="Yok"
      >
        <X className="h-3 w-3 text-white" strokeWidth={3} />
      </span>
    );
  }
  return <span className="text-sm text-muted-foreground">{value}</span>;
}

function BillingPeriodSwitch({
  billingPeriod,
  onChange,
}: {
  billingPeriod: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
}) {
  const yearly = billingPeriod === "YEARLY";

  return (
    <div className="flex items-center justify-center gap-3">
      <Label
        htmlFor="billing-period-switch"
        className={cn(
          "cursor-pointer text-sm font-medium transition-colors duration-200",
          !yearly ? "text-foreground" : "text-muted-foreground",
        )}
      >
        Aylık
      </Label>
      <Switch
        id="billing-period-switch"
        checked={yearly}
        onCheckedChange={(checked) => onChange(checked ? "YEARLY" : "MONTHLY")}
        aria-label="Aylık ve yıllık fiyat arasında geçiş yap"
      />
      <Label
        htmlFor="billing-period-switch"
        className={cn(
          "cursor-pointer text-sm font-medium transition-colors duration-200",
          yearly ? "text-foreground" : "text-muted-foreground",
        )}
      >
        Yıllık
      </Label>
    </div>
  );
}

function AnimatedPackagePrice({
  pricing,
  currency,
}: {
  pricing: PackagePricing;
  currency: string;
}) {
  const amountLabel = formatPackagePrice(pricing.amount, currency);
  const compareLabel =
    pricing.compareAmount != null ? formatPackagePrice(pricing.compareAmount, currency) : null;

  return (
    <div className="mt-4 min-h-[3.25rem] overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pricing.period}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="flex flex-wrap items-baseline gap-x-2 gap-y-1"
        >
          {compareLabel ? (
            <span className="text-lg text-muted-foreground line-through decoration-muted-foreground/80">
              {compareLabel}
              {pricing.compareSuffix ? (
                <span className="ml-1 text-sm font-normal">{pricing.compareSuffix}</span>
              ) : null}
            </span>
          ) : null}
          <span className="text-3xl font-bold tracking-tight text-foreground">{amountLabel}</span>
          {pricing.amount > 0 ? (
            <span className="text-sm text-muted-foreground">{pricing.suffix}</span>
          ) : null}
          {pricing.yearlySavings != null && pricing.yearlySavings > 0 ? (
            <span
              className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium leading-none text-emerald-600 dark:text-emerald-400"
              title={formatYearlySavingsLabel(pricing.yearlySavings, currency)}
            >
              {formatYearlySavingsBadge(
                pricing.yearlySavings,
                currency,
                resolveYearlySavingsPercent(pricing),
              )}
            </span>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function PackageComparisonView() {
  const searchParams = useSearchParams();
  const highlight = searchParams.get("highlight");
  const { subscription, packages, featureRows, eligibleTrials, isLoading, isError } =
    usePackageCatalog();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("MONTHLY");

  const current = subscription.data?.activePurchase ?? null;
  const trialEligibleIds = useMemo(
    () => new Set((eligibleTrials.data ?? []).map((pkg) => pkg.id)),
    [eligibleTrials.data],
  );
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

  if (isLoading) {
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
              Tüm planları tek ekranda karşılaştırın ve size uygun paketi seçin.
            </p>
          </div>
        </div>
        <PackageComparisonCurrentPlanSkeleton />
        <PackageComparisonSkeleton />
      </div>
    );
  }

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
            Tüm planları tek ekranda karşılaştırın ve size uygun paketi seçin.
          </p>
        </div>
      </div>

      <div className="smart-feature-panel">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white dark:border-border dark:bg-background">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Şu an bunu kullanıyorsunuz
            </p>
            {subscription.isLoading ? (
              <div className="mt-2 h-10 animate-pulse rounded-md bg-muted" />
            ) : current ? (
              <>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">{current.packageName}</h2>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {purchaseTypeLabel(current.purchaseType)}
                  </span>
                </div>
                {current.expiresAt ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Bitiş {formatPackageDate(current.expiresAt)} · {formatDaysUntilExpiry(current.daysUntilExpiry)}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Aktif paket bilgisi bulunamadı.</p>
            )}
          </div>
        </div>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">Paketler yüklenemedi. Lütfen sayfayı yenileyin.</p>
      ) : packages.length === 0 ? (
        <p className="text-sm text-muted-foreground">Karşılaştırılacak paket bulunamadı.</p>
      ) : (
        <div className="space-y-6">
          <BillingPeriodSwitch billingPeriod={billingPeriod} onChange={setBillingPeriod} />

          <div
            className={cn(
              "grid gap-4",
              packages.length >= 3 ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2",
            )}
          >
            {packages.map((pkg) => {
              const isCurrent = current?.packageId === pkg.id;
              const highlightMatch =
                !!highlight &&
                pkg.items?.some((item) => matchesProductCode(item.productCode, highlight));
              const pricing = resolvePackagePricing(pkg, billingPeriod);
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
                <div
                  key={pkg.id}
                  className={cn(
                    "smart-feature-panel flex h-full flex-col",
                    isCurrent && "ring-2 ring-primary/25",
                    highlightMatch && "ring-2 ring-primary/40",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">{pkg.name}</h3>
                        {isCurrent ? (
                          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                            Mevcut
                          </span>
                        ) : null}
                        {highlightMatch ? (
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                            Önerilen
                          </span>
                        ) : null}
                      </div>
                      {pkg.description?.trim() ? (
                        <p className="mt-1 text-sm text-muted-foreground">{pkg.description.trim()}</p>
                      ) : null}
                    </div>
                  </div>

                  <AnimatedPackagePrice pricing={pricing} currency={pkg.currency} />

                  <ul className="mt-5 flex-1 space-y-2.5 border-t border-[#e5e7eb] pt-4 dark:border-border">
                    {featureRows.map((row) => (
                      <li key={`${pkg.id}-${row.id}`} className="flex items-start gap-2.5">
                        <ComparisonCellValue value={row.values[String(pkg.id)] ?? "—"} />
                        <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 text-sm text-foreground">
                          <span>{row.label}</span>
                          {row.productCode ? (
                            <FeatureHintByProduct productCode={row.productCode} size="sm" />
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 space-y-2">
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
                      <p className="text-center text-[11px] text-muted-foreground">
                        Deneme için Dijital Menü veya Abonelik ekranından başlatabilirsiniz.
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
