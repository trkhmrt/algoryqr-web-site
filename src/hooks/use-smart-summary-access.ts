"use client";

import { useActivePackages, useSubscription } from "@/hooks/use-subscription";
import { filterCatalogPackages } from "@/lib/package-display";
import {
  hasActiveProductAccess,
  hasActivePackageProduct,
  isDateUsablePurchase,
  matchesProductCode,
  packageIncludesProduct,
} from "@/lib/product-access";

const SMART_SUMMARY_PRODUCT = "SMART_SUMMARY";

export function useSmartSummaryAccess() {
  const subscription = useSubscription();
  const packages = useActivePackages();
  const activePurchase = subscription.data?.activePurchase ?? null;
  const catalogPackages = packages.data ?? [];
  const entitlements = Array.isArray(subscription.data?.entitlements)
    ? subscription.data.entitlements
    : [];
  const purchases = Array.isArray(subscription.data?.purchases) ? subscription.data.purchases : [];

  const activePackage =
    catalogPackages.find(
      (pkg) => activePurchase?.packageId != null && pkg.id === activePurchase.packageId,
    ) ??
    catalogPackages.find(
      (pkg) => !!activePurchase?.packageCode && pkg.code === activePurchase.packageCode,
    ) ??
    null;

  const activePackageHasSmartSummary =
    !!activePurchase &&
    isDateUsablePurchase(activePurchase) &&
    !!activePackage?.items?.some((item) =>
      matchesProductCode(item.productCode, SMART_SUMMARY_PRODUCT),
    );

  const canUseSmartSummary =
    hasActiveProductAccess(entitlements, purchases, SMART_SUMMARY_PRODUCT) ||
    activePackageHasSmartSummary ||
    hasActivePackageProduct(activePurchase, catalogPackages, SMART_SUMMARY_PRODUCT);

  const smartSummaryPackageNames = filterCatalogPackages(catalogPackages)
    .filter((pkg) => packageIncludesProduct(pkg, SMART_SUMMARY_PRODUCT))
    .map((pkg) => pkg.name?.trim())
    .filter((name): name is string => !!name);

  return {
    accessLoading: subscription.isLoading || packages.isLoading,
    canUseSmartSummary,
    smartSummaryPackageNames,
  };
}
