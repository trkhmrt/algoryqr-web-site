"use client";

import { useActivePackages, useSubscription } from "@/hooks/use-subscription";
import { filterCatalogPackages } from "@/lib/package-display";
import { hasActivePackageProduct, packageIncludesProduct } from "@/lib/product-access";

const SMART_REPORTING_PRODUCT = "SMART_REPORTING";

export function useSmartReportingAccess() {
  const subscription = useSubscription();
  const packages = useActivePackages();
  const activePurchase = subscription.data?.activePurchase ?? null;
  const catalogPackages = packages.data ?? [];

  const canUseSmartReporting = hasActivePackageProduct(
    activePurchase,
    catalogPackages,
    SMART_REPORTING_PRODUCT,
  );

  const smartReportingPackageNames = filterCatalogPackages(catalogPackages)
    .filter((pkg) => packageIncludesProduct(pkg, SMART_REPORTING_PRODUCT))
    .map((pkg) => pkg.name?.trim())
    .filter((name): name is string => !!name);

  return {
    accessLoading: subscription.isLoading || packages.isLoading,
    canUseSmartReporting,
    smartReportingPackageNames,
  };
}
