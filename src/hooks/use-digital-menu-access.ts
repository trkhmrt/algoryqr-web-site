"use client";

import { useAccessProfile } from "@/hooks/use-access-profile";
import { useActivePackages, useSubscription } from "@/hooks/use-subscription";
import { hasProduct, hasScope } from "@/lib/auth-user";
import {
  hasActivePackageProduct,
  hasActiveProductAccess,
  hasExpiredProductAccess,
} from "@/lib/product-access";

const QR_MENU_PRODUCT = "QR_MENU";

export function useDigitalMenuAccess() {
  const { data: accessProfile, isLoading: accessLoading } = useAccessProfile();
  const subscription = useSubscription();
  const packages = useActivePackages();

  const activePurchase = subscription.data?.activePurchase ?? null;
  const catalogPackages = packages.data ?? [];
  const entitlements = subscription.data?.entitlements ?? [];
  const purchases = subscription.data?.purchases ?? [];

  const canUseDigitalMenu =
    hasScope(accessProfile, "QR_MENU_OWNER") ||
    hasProduct(accessProfile, QR_MENU_PRODUCT) ||
    hasActiveProductAccess(entitlements, purchases, QR_MENU_PRODUCT) ||
    hasActivePackageProduct(activePurchase, catalogPackages, QR_MENU_PRODUCT);

  const hadExpiredAccess =
    !canUseDigitalMenu &&
    hasExpiredProductAccess(entitlements, purchases, QR_MENU_PRODUCT);

  return {
    accessLoading: accessLoading || subscription.isLoading || packages.isLoading,
    canUseDigitalMenu,
    hadExpiredAccess,
  };
}
