"use client";

import { useQuery } from "@tanstack/react-query";

import { getBranchSummaryAnalyticsRequest } from "@/lib/api";

export const branchSummaryAnalyticsQueryKey = (
  branchId: number | null,
  menuId: number | null,
  from: string,
  to: string,
) => ["branchSummaryAnalytics", branchId, menuId, from, to] as const;

export function useBranchSummaryAnalytics(
  branchId: number | null,
  menuId: number | null,
  from: string,
  to: string,
  enabled = true,
) {
  return useQuery({
    queryKey: branchSummaryAnalyticsQueryKey(branchId, menuId, from, to),
    queryFn: () => getBranchSummaryAnalyticsRequest(branchId as number, from, to, menuId),
    enabled: enabled && branchId != null,
    staleTime: 60_000,
    retry: 1,
  });
}
