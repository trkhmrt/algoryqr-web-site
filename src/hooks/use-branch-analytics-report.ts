"use client";

import { useQuery } from "@tanstack/react-query";

import { getBranchAnalyticsReportRequest } from "@/lib/api";

export const branchAnalyticsReportQueryKey = (
  branchId: number | null,
  menuId: number | null,
  from: string,
  to: string,
) => ["branchAnalyticsReport", branchId, menuId, from, to] as const;

export function useBranchAnalyticsReport(
  branchId: number | null,
  menuId: number | null,
  from: string,
  to: string,
  enabled = true,
) {
  return useQuery({
    queryKey: branchAnalyticsReportQueryKey(branchId, menuId, from, to),
    queryFn: () => getBranchAnalyticsReportRequest(branchId as number, from, to, menuId),
    enabled: enabled && branchId != null,
    staleTime: 60_000,
    retry: 1,
  });
}
