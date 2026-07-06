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
} from "@/lib/api";

export const SUBSCRIPTION_QUERY_KEY = ["subscription"] as const;

export interface SubscriptionData {
  usage: PackageUsageSummary;
  purchases: PurchaseApiItem[];
  activePurchase: PurchaseApiItem | null;
  packages: PlanPackageApiItem[];
}

export function useSubscription(enabled = true) {
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: async (): Promise<SubscriptionData> => {
      const [entitlements, purchases, packages] = await Promise.all([
        getMyEntitlementsRequest(),
        getMyPurchasesRequest(),
        getActivePackagesRequest(),
      ]);
      const usage = aggregatePackageUsage(entitlements, purchases);
      const activePurchase = purchases.find((p) => p.usable && !p.expired) ?? null;
      return { usage, purchases, activePurchase, packages };
    },
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}

export function invalidateSubscription(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY, exact: false });
}
