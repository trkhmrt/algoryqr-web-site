"use client";

import { useQuery } from "@tanstack/react-query";

import { getMenuRevenueReportRequest } from "@/lib/api";

export const menuRevenueReportQueryKey = (
  menuId: number | null,
  from: string,
  to: string,
) => ["menuRevenueReport", menuId, from, to] as const;

export function useMenuRevenueReport(
  menuId: number | null,
  from: string,
  to: string,
  enabled = true,
) {
  return useQuery({
    queryKey: menuRevenueReportQueryKey(menuId, from, to),
    queryFn: () => getMenuRevenueReportRequest(menuId as number, from, to),
    enabled: enabled && menuId != null,
    staleTime: 60_000,
    retry: 1,
  });
}
