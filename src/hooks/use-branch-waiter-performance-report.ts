"use client";

import { useQuery } from "@tanstack/react-query";

import { getBranchWaiterPerformanceReportRequest } from "@/lib/api";

export const branchWaiterPerformanceReportQueryKey = (
  branchId: number | null,
  menuId: number | null,
  from: string,
  to: string,
) => ["branchWaiterPerformanceReport", branchId, menuId, from, to] as const;

export function useBranchWaiterPerformanceReport(
  branchId: number | null,
  menuId: number | null,
  from: string,
  to: string,
  enabled = true,
) {
  return useQuery({
    queryKey: branchWaiterPerformanceReportQueryKey(branchId, menuId, from, to),
    queryFn: () => getBranchWaiterPerformanceReportRequest(branchId as number, from, to, menuId),
    enabled: enabled && branchId != null,
    staleTime: 60_000,
    retry: 1,
  });
}
