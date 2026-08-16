"use client";

import { useQuery } from "@tanstack/react-query";

import { getMenuWaiterPerformanceReportRequest } from "@/lib/api";

export const menuWaiterPerformanceReportQueryKey = (
  menuId: number | null,
  from: string,
  to: string,
) => ["menuWaiterPerformanceReport", menuId, from, to] as const;

export function useMenuWaiterPerformanceReport(
  menuId: number | null,
  from: string,
  to: string,
  enabled = true,
) {
  return useQuery({
    queryKey: menuWaiterPerformanceReportQueryKey(menuId, from, to),
    queryFn: () => getMenuWaiterPerformanceReportRequest(menuId as number, from, to),
    enabled: enabled && menuId != null,
    staleTime: 60_000,
    retry: 1,
  });
}
