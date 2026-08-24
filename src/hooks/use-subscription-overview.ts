"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";

import {
  aggregatePackageUsage,
  getMySubscriptionOverviewRequest,
  type PackageUsageSummary,
  type PurchaseApiItem,
  type PurchaseSummaryApiItem,
  type SubscriptionOverviewApiItem,
  type UserEntitlementApiItem,
} from "@/lib/api";
import { isRefundInFlight } from "@/lib/refund-display";

export const SUBSCRIPTION_OVERVIEW_QUERY_KEY = ["subscriptionOverview"] as const;

export interface SubscriptionOverviewData {
  activePackage: PurchaseSummaryApiItem | null;
  entitlements: UserEntitlementApiItem[];
  addonPurchases: PurchaseSummaryApiItem[];
  branchQuota: SubscriptionOverviewApiItem["branchQuota"];
  menuQuota: SubscriptionOverviewApiItem["menuQuota"];
  usage: PackageUsageSummary;
  activePurchase: PurchaseApiItem | null;
}

function mapSummaryToPurchaseItem(summary: PurchaseSummaryApiItem): PurchaseApiItem {
  return {
    id: summary.purchaseId,
    packageId: summary.packageId,
    packageName: summary.packageName,
    packageCode: summary.packageCode,
    price: summary.price,
    currency: summary.currency,
    status: summary.status,
    purchaseType: summary.purchaseType,
    paymentStyle: summary.paymentStyle,
    installmentCount: summary.installmentCount,
    paymentId: summary.paymentId,
    paymentConversationId: summary.paymentConversationId,
    paymentMethodId: summary.paymentMethodId,
    cardBrand: summary.cardBrand,
    cardLastFour: summary.cardLastFour,
    startsAt: summary.startsAt,
    expiresAt: summary.expiresAt,
    purchasedAt: summary.purchasedAt,
    subscriptionStatus: summary.subscriptionStatus,
    billingPeriod: summary.billingPeriod,
    cancelAtPeriodEnd: summary.cancelAtPeriodEnd,
    currentPeriodConversationId: summary.currentPeriodConversationId,
    currentPeriodPaidAt: summary.currentPeriodPaidAt,
    subscriptionGraceEndsAt: summary.subscriptionGraceEndsAt,
    manualPaymentRequired: summary.manualPaymentRequired,
    refundEligibleUntil: summary.refundEligibleUntil,
    refundEligible: summary.refundEligible,
    refundableAmount: summary.refundableAmount,
    refundCoolingDays: summary.refundCoolingDays,
    refundedAt: summary.refundedAt,
    refundStatus: summary.refundStatus,
    daysUntilExpiry: summary.daysUntilExpiry,
    nextPaymentDueAt: summary.nextPaymentDueAt,
    paymentApproaching: summary.paymentApproaching,
    expiryApproaching: summary.expiryApproaching,
    usable: summary.usable,
    expired: summary.expired,
  };
}

export function useSubscriptionOverview(enabled = true) {
  return useQuery({
    queryKey: SUBSCRIPTION_OVERVIEW_QUERY_KEY,
    queryFn: async (): Promise<SubscriptionOverviewData> => {
      const overview = await getMySubscriptionOverviewRequest();
      const activePurchase = overview.activePackage
        ? mapSummaryToPurchaseItem(overview.activePackage)
        : null;
      const purchases = activePurchase ? [activePurchase] : [];
      const usage = aggregatePackageUsage(overview.entitlements, purchases);
      return {
        activePackage: overview.activePackage,
        entitlements: overview.entitlements,
        addonPurchases: overview.addonPurchases ?? [],
        branchQuota: overview.branchQuota ?? null,
        menuQuota: overview.menuQuota ?? null,
        usage,
        activePurchase,
      };
    },
    enabled,
    staleTime: 30_000,
    retry: 1,
    refetchInterval: (query) =>
      isRefundInFlight(query.state.data?.activePackage?.refundStatus) ? 2_500 : false,
  });
}

export function invalidateSubscriptionOverview(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_OVERVIEW_QUERY_KEY, exact: false });
}
