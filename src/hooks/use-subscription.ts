"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";

import {
  aggregatePackageUsage,
  getActivePackagesRequest,
  getMyEntitlementsRequest,
  getMyPurchasesRequest,
  type PackageUsageSummary,
  type PlanPackageApiItem,
  type PurchaseApiItem,
  type UserEntitlementApiItem,
} from "@/lib/api";
import { pickActivePurchase } from "@/lib/product-access";

export const SUBSCRIPTION_QUERY_KEY = ["subscription"] as const;
export const ACTIVE_PACKAGES_QUERY_KEY = ["activePackages"] as const;

export interface SubscriptionData {
  usage: PackageUsageSummary;
  entitlements: UserEntitlementApiItem[];
  purchases: PurchaseApiItem[];
  activePurchase: PurchaseApiItem | null;
}

export function useSubscription(enabled = true) {
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: async (): Promise<SubscriptionData> => {
      const [entitlements, purchases] = await Promise.all([
        getMyEntitlementsRequest(),
        getMyPurchasesRequest(),
      ]);
      const usage = aggregatePackageUsage(entitlements, purchases);
      const activePurchase = pickActivePurchase(purchases);
      return { usage, entitlements, purchases, activePurchase };
    },
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useActivePackages(enabled = true) {
  return useQuery({
    queryKey: ACTIVE_PACKAGES_QUERY_KEY,
    queryFn: (): Promise<PlanPackageApiItem[]> => getActivePackagesRequest(),
    enabled,
    staleTime: 60_000,
    retry: 1,
  });
}

export function invalidateSubscription(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY, exact: false });
}

export function invalidateActivePackages(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: ACTIVE_PACKAGES_QUERY_KEY, exact: false });
}
