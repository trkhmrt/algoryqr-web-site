"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";

import { PackageComparisonSkeleton } from "@/components/dashboard/PackageComparisonSkeleton";
import { AnimatedPackagePrice } from "@/components/packages/AnimatedPackagePrice";
import { TrialFadeButton } from "@/components/packages/TrialFadeButton";
import { Button } from "@/components/ui/button";
import { FeatureHintByProduct } from "@/components/ui/FeatureHint";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useActivePackages } from "@/hooks/use-subscription";
import type { PlanPackageApiItem, StoredUser } from "@/lib/api";
import type { BillingPeriod } from "@/lib/commerce";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  buildPackageComparisonRows,
  filterCatalogPackages,
  resolvePackagePricing,
} from "@/lib/package-display";
import { buildRegisterTrialUrl, buildTrialStartUrl } from "@/lib/trial-flow";
import { cn } from "@/lib/utils";
import { Tx, useT } from "@/components/google-translate-provider";

interface PricingSectionProps {
  initialUser?: StoredUser | null;
}

function ComparisonCellValue({ value }: { value: string }) {
  const t = useT();
  if (value === "Var") {
    return (
      <span
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600"
        aria-label={t("Var")}
      >
        <Check className="h-3 w-3 text-white" strokeWidth={3} />
      </span>
    );
  }
  if (value === "Yok") {
    return (
      <span
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600"
        aria-label={t("Yok")}
      >
        <X className="h-3 w-3 text-white" strokeWidth={3} />
      </span>
    );
  }
  return <span className="text-sm text-muted-foreground">{t(value)}</span>;
}

function BillingPeriodSwitch({
  billingPeriod,
  onChange,
}: {
  billingPeriod: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
}) {
  const t = useT();
  const yearly = billingPeriod === "YEARLY";

  return (
    <div className="flex items-center justify-center gap-3">
      <Label
        htmlFor="homepage-billing-period-switch"
        className={cn(
          "cursor-pointer text-sm font-medium transition-colors duration-200",
          !yearly ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {t("Aylık")}
      </Label>
      <Switch
        id="homepage-billing-period-switch"
        checked={yearly}
        onCheckedChange={(checked) => onChange(checked ? "YEARLY" : "MONTHLY")}
        aria-label={t("Aylık ve yıllık fiyat arasında geçiş yap")}
      />
      <Label
        htmlFor="homepage-billing-period-switch"
        className={cn(
          "cursor-pointer text-sm font-medium transition-colors duration-200",
          yearly ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {t("Yıllık")}
      </Label>
    </div>
  );
}

function packageCtaHref(pkg: PlanPackageApiItem, isLoggedIn: boolean): string {
  if (pkg.code === "ULTIMATE_PACKAGE") {
    return isLoggedIn ? buildTrialStartUrl("ultimate") : buildRegisterTrialUrl("ultimate");
  }
  if (!isLoggedIn) {
    return "/register";
  }
  if (pkg.code === "FREE_PACKAGE") {
    return DASHBOARD_ROUTES.accountPackages;
  }
  return DASHBOARD_ROUTES.accountSubscriptionCheckout(pkg.id);
}

function packageSubtitle(pkg: PlanPackageApiItem): string | null {
  if (pkg.code === "ULTIMATE_PACKAGE") {
    return null;
  }
  const description = pkg.description?.trim();
  return description || null;
}

function isTrialPackage(pkg: PlanPackageApiItem): boolean {
  return pkg.code === "ULTIMATE_PACKAGE";
}

function packageCtaLabel(pkg: PlanPackageApiItem): string {
  if (isTrialPackage(pkg)) {
    return "30 gün ücretsiz dene";
  }
  if (pkg.code === "FREE_PACKAGE" || Number(pkg.price) === 0) {
    return "Ücretsiz Başla";
  }
  return "Satın al";
}

const PricingSection = ({ initialUser = null }: PricingSectionProps) => {
  const t = useT();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("MONTHLY");
  const packagesQuery = useActivePackages();
  const isLoggedIn = Boolean(initialUser);

  const packages = useMemo(
    () =>
      filterCatalogPackages(packagesQuery.data ?? [])
        .filter((pkg) => pkg.code !== "FREE_PACKAGE" && pkg.code !== "CORPORATE_PACKAGE")
        .sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0)),
    [packagesQuery.data],
  );

  const featureRows = useMemo(() => {
    const rows = buildPackageComparisonRows(packages);
    return rows.filter((row) => !["price", "validity", "trialEligible"].includes(row.id));
  }, [packages]);

  const isLoading = packagesQuery.isLoading || (packagesQuery.isFetching && packages.length === 0);

  return (
    <section id="pricing" ref={ref} className="relative scroll-mt-14 sm:scroll-mt-16 py-[clamp(3.5rem,8vw,8rem)]">
      <div className="container mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14 md:mb-16 space-y-3 sm:space-y-4"
        >
          <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
            <Tx>Fiyatlandırma</Tx>
          </p>
          <h2 className="sr-heading text-3xl leading-[1.05] sm:text-5xl text-balance">
            <Tx>İşletmenize uygun paketi seçin</Tx>
          </h2>
          <p className="section-desc max-w-lg mx-auto text-pretty">
            <Tx>Tüm planları karşılaştırın. Ücretsiz başlayın veya ihtiyacınıza göre yükseltin.</Tx>
          </p>
        </motion.div>

        {isLoading ? (
          <PackageComparisonSkeleton cardCount={3} />
        ) : packagesQuery.isError ? (
          <p className="text-center text-sm text-muted-foreground">
            <Tx>Paketler yüklenemedi. Lütfen daha sonra tekrar deneyin.</Tx>
          </p>
        ) : packages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            <Tx>Şu an listelenecek paket bulunamadı.</Tx>
          </p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            <BillingPeriodSwitch billingPeriod={billingPeriod} onChange={setBillingPeriod} />

            <div
              className={cn(
                "mx-auto grid grid-cols-1 gap-4 min-[720px]:gap-3 lg:gap-4 xl:gap-5",
                packages.length <= 2
                  ? "min-[720px]:grid-cols-2 max-w-3xl"
                  : "min-[720px]:grid-cols-3",
              )}
            >
              {packages.map((pkg) => {
                const pricing = resolvePackagePricing(pkg, billingPeriod);
                const isPopular = pkg.code === "PRO_PACKAGE";
                const isTrial = isTrialPackage(pkg);
                const subtitle = packageSubtitle(pkg);

                return (
                  <div
                    key={pkg.id}
                    className={cn(
                      "smart-feature-panel flex h-full min-w-0 flex-col !rounded-[1.75rem] !p-4 sm:!rounded-[2rem] sm:!p-5 lg:!p-6 xl:!p-7",
                      isPopular && "ring-2 ring-primary/30",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-foreground sm:text-lg">{t(pkg.name)}</h3>
                          {isPopular ? (
                            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                              <Tx>Popüler</Tx>
                            </span>
                          ) : null}
                        </div>
                        {subtitle ? (
                          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{t(subtitle)}</p>
                        ) : null}
                      </div>
                    </div>

                    <AnimatedPackagePrice pricing={pricing} currency={pkg.currency} size="compact" />

                    <ul className="mt-4 flex-1 space-y-2 border-t border-[#e5e7eb] pt-3 dark:border-border sm:mt-5 sm:space-y-2.5 sm:pt-4">
                      {featureRows.map((row) => (
                        <li key={`${pkg.id}-${row.id}`} className="flex items-start gap-2 sm:gap-2.5">
                          <ComparisonCellValue value={row.values[String(pkg.id)] ?? "—"} />
                          <span className="inline-flex min-w-0 flex-1 items-center gap-1 text-xs text-foreground sm:gap-1.5 sm:text-sm">
                            <span className="leading-snug">{t(row.label)}</span>
                            {row.productCode ? (
                              <FeatureHintByProduct productCode={row.productCode} size="sm" />
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4 sm:mt-5">
                      {isTrial ? (
                        <TrialFadeButton
                          href={packageCtaHref(pkg, isLoggedIn)}
                          label={t(packageCtaLabel(pkg))}
                        />
                      ) : (
                        <Button
                          className="w-full min-h-11 gap-2 text-sm sm:text-base"
                          variant={isPopular ? "hero" : "outline"}
                          size="lg"
                          asChild
                        >
                          <Link href={packageCtaHref(pkg, isLoggedIn)}>
                            {t(packageCtaLabel(pkg))}
                            <ArrowRight className="h-4 w-4 shrink-0" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default PricingSection;
