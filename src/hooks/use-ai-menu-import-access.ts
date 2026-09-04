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

const AI_MENU_IMPORT_PRODUCT = "AI_MENU_IMPORT";

export function useAiMenuImportAccess() {
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

  const activePackageHasFeature =
    !!activePurchase &&
    isDateUsablePurchase(activePurchase) &&
    !!activePackage?.items?.some((item) =>
      matchesProductCode(item.productCode, AI_MENU_IMPORT_PRODUCT),
    );

  const canUseAiMenuImport =
    hasActiveProductAccess(entitlements, purchases, AI_MENU_IMPORT_PRODUCT) ||
    activePackageHasFeature ||
    hasActivePackageProduct(activePurchase, catalogPackages, AI_MENU_IMPORT_PRODUCT);

  const aiMenuImportPackageNames = filterCatalogPackages(catalogPackages)
    .filter((pkg) => packageIncludesProduct(pkg, AI_MENU_IMPORT_PRODUCT))
    .map((pkg) => pkg.name?.trim())
    .filter((name): name is string => !!name);

  return {
    accessLoading: subscription.isLoading || packages.isLoading,
    canUseAiMenuImport,
    aiMenuImportPackageNames,
  };
}
