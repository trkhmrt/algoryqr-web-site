"use client";

import { useQuery } from "@tanstack/react-query";

import { getMenuAnalyticsReportRequest } from "@/lib/api";

export const menuAnalyticsReportQueryKey = (
  menuId: number | null,
  from: string,
  to: string,
) => ["menuAnalyticsReport", menuId, from, to] as const;

export function useMenuAnalyticsReport(
  menuId: number | null,
  from: string,
  to: string,
  enabled = true,
) {
  return useQuery({
    queryKey: menuAnalyticsReportQueryKey(menuId, from, to),
    queryFn: () => getMenuAnalyticsReportRequest(menuId as number, from, to),
    enabled: enabled && menuId != null,
    staleTime: 60_000,
    retry: 1,
  });
}
