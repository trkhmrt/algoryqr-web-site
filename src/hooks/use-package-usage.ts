"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";

import {
  aggregatePackageUsage,
  getMyEntitlementsRequest,
  getMyPurchasesRequest,
  type PackageUsageSummary,
} from "@/lib/api";

export const PACKAGE_USAGE_QUERY_KEY = ["packageUsage"] as const;

export function usePackageUsage(enabled = true) {
  return useQuery({
    queryKey: PACKAGE_USAGE_QUERY_KEY,
    queryFn: async (): Promise<PackageUsageSummary> => {
      const [entitlements, purchases] = await Promise.all([
        getMyEntitlementsRequest(),
        getMyPurchasesRequest(),
      ]);
      return aggregatePackageUsage(entitlements, purchases);
    },
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}

export function invalidatePackageUsage(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: PACKAGE_USAGE_QUERY_KEY, exact: false });
}
