"use client";

import { useQuery } from "@tanstack/react-query";

import { getBranchRevenueReportRequest } from "@/lib/api";

export const branchRevenueReportQueryKey = (
  branchId: number | null,
  menuId: number | null,
  from: string,
  to: string,
) => ["branchRevenueReport", branchId, menuId, from, to] as const;

export function useBranchRevenueReport(
  branchId: number | null,
  menuId: number | null,
  from: string,
  to: string,
  enabled = true,
) {
  return useQuery({
    queryKey: branchRevenueReportQueryKey(branchId, menuId, from, to),
    queryFn: () => getBranchRevenueReportRequest(branchId as number, from, to, menuId),
    enabled: enabled && branchId != null,
    staleTime: 60_000,
    retry: 1,
  });
}
