import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";

import type { PlanPackageApiItem } from "@/lib/api";
import { formatPackagePrice, packageFeatures } from "@/lib/package-display";

interface PricingSectionProps {
  packages?: PlanPackageApiItem[];
}

function periodLabel(validityDays?: number): string | null {
  if (!validityDays || validityDays <= 0) return null;
  if (validityDays === 30) return "/ay";
  if (validityDays === 365 || validityDays === 366) return "/yıl";
  return `/${validityDays} gün`;
}

function sortPackages(packages: PlanPackageApiItem[]): PlanPackageApiItem[] {
  return [...packages].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
}

function featuredPackageId(packages: PlanPackageApiItem[]): number | null {
  const paid = packages.filter((pkg) => (Number(pkg.price) || 0) > 0);
  if (paid.length === 0) return null;
  if (paid.length === 1) return paid[0].id;
  return paid[Math.min(1, paid.length - 1)]?.id ?? paid[0].id;
}

function ctaLabel(pkg: PlanPackageApiItem): string {
  if ((Number(pkg.price) || 0) <= 0) return "Ücretsiz Başla";
  return "Başla";
}

const PricingSection = ({ packages = [] }: PricingSectionProps) => {
  const plans = sortPackages(packages);
  const featuredId = featuredPackageId(plans);
  const gridClass =
    plans.length >= 3
      ? "grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
      : plans.length === 2
        ? "grid md:grid-cols-2 gap-6 max-w-3xl mx-auto"
        : "grid gap-6 max-w-md mx-auto";

  return (
    <section id="pricing" className="py-32 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <p className="text-sm font-mono text-primary uppercase tracking-widest">Fiyatlandırma</p>
          <h2 className="text-4xl md:text-5xl font-bold">
            Basit & <span className="text-gradient">Şeffaf</span>
          </h2>
        </div>

        {plans.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Paketler şu an yüklenemedi. Lütfen daha sonra tekrar deneyin.
          </p>
        ) : (
          <div className={gridClass}>
            {plans.map((pkg) => {
              const featured = pkg.id === featuredId;
              const features = packageFeatures(pkg);
              const period = periodLabel(pkg.validityDays);
              const price = formatPackagePrice(pkg.price, pkg.currency);

              return (
                <div
                  key={pkg.id}
                  className={`rounded-xl p-6 flex flex-col ${
                    featured
                      ? "border-2 border-primary/50 bg-card glow-card relative"
                      : "glass"
                  }`}
                >
                  {featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Popüler
                    </div>
                  )}
                  <h3 className="text-lg font-semibold">{pkg.name}</h3>
                  <div className="mt-3 mb-1">
                    <span className="text-3xl font-bold">{price}</span>
                    {period && price !== "Ücretsiz" ? (
                      <span className="text-muted-foreground text-sm">{period}</span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    {pkg.description?.trim() || "İşletmeniz için uygun paket"}
                  </p>

                  <ul className="space-y-3 mb-8 flex-1">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link href="/register">
                    <Button
                      variant={featured ? "hero" : "heroOutline"}
                      className="w-full"
                    >
                      {ctaLabel(pkg)}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default PricingSection;
