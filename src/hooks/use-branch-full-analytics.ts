"use client";

import { useQuery } from "@tanstack/react-query";

import { getBranchFullAnalyticsRequest } from "@/lib/api";

export const branchFullAnalyticsQueryKey = (
  branchId: number | null,
  menuId: number | null,
  from: string,
  to: string,
) => ["branchFullAnalytics", branchId, menuId, from, to] as const;

export function useBranchFullAnalytics(
  branchId: number | null,
  menuId: number | null,
  from: string,
  to: string,
  enabled = true,
) {
  return useQuery({
    queryKey: branchFullAnalyticsQueryKey(branchId, menuId, from, to),
    queryFn: () => getBranchFullAnalyticsRequest(branchId as number, from, to, menuId),
    enabled: enabled && branchId != null,
    staleTime: 60_000,
    retry: 1,
  });
}
