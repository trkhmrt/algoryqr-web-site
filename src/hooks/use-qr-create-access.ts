"use client";

import { useMemo } from "react";

import { useAccessProfile } from "@/hooks/use-access-profile";
import { useActivePackages, useSubscription } from "@/hooks/use-subscription";
import { aggregatePackageUsage } from "@/lib/api";
import { hasScope } from "@/lib/auth-user";
import {
  formatQrCreateQuotaLabel,
  hasQrCreateQuotaRemaining,
  summarizeQrCreateQuota,
  type QrCreateQuotaSummary,
} from "@/lib/entitlement-display";
import {
  hasActivePackageProduct,
  hasActiveProductAccess,
} from "@/lib/product-access";

const QR_CREATE_PRODUCT = "QR_CREATE";

export function useQrCreateAccess() {
  const { data: accessProfile, isLoading: accessLoading } = useAccessProfile();
  const subscription = useSubscription();
  const packages = useActivePackages();

  const activePurchase = subscription.data?.activePurchase ?? null;
  const catalogPackages = packages.data ?? [];
  const entitlements = subscription.data?.entitlements ?? [];
  const purchases = subscription.data?.purchases ?? [];

  const hasScopeAccess = hasScope(accessProfile, "QR_CREATE_OWNER");
  const hasProductAccess =
    hasScopeAccess ||
    hasActiveProductAccess(entitlements, purchases, QR_CREATE_PRODUCT) ||
    hasActivePackageProduct(activePurchase, catalogPackages, QR_CREATE_PRODUCT);

  const qrQuota = useMemo<QrCreateQuotaSummary | null>(() => {
    if (hasScopeAccess) {
      return summarizeQrCreateQuota({
        remaining: Number.POSITIVE_INFINITY,
        total: 0,
        used: 0,
        unlimited: true,
        usable: true,
      });
    }
    const usage = aggregatePackageUsage(entitlements, purchases);
    if (!hasProductAccess && !usage.usable) {
      return null;
    }
    return summarizeQrCreateQuota({
      remaining: usage.remaining,
      total: usage.total,
      used: usage.used,
      unlimited: usage.unlimited,
      usable: usage.usable || hasProductAccess,
    });
  }, [entitlements, hasProductAccess, hasScopeAccess, purchases]);

  const hasQuotaRemaining = hasScopeAccess || hasQrCreateQuotaRemaining(qrQuota);
  const canCreateQr = hasProductAccess && hasQuotaRemaining;
  const qrQuotaLabel = formatQrCreateQuotaLabel(qrQuota);

  return {
    accessLoading: accessLoading || subscription.isLoading || packages.isLoading,
    canCreateQr,
    hasProductAccess,
    hasQuotaRemaining,
    qrQuota,
    qrQuotaLabel,
  };
}
