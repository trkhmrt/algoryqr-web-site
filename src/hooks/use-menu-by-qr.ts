"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";

import { getMenuByQrIdRequest, type MenuProfileApiItem } from "@/lib/api";

export const menuByQrQueryKey = (qrId: number | string) => ["menuByQr", qrId] as const;

export function useMenuByQr(qrId: number | null | undefined, enabled = true) {
  return useQuery({
    queryKey: menuByQrQueryKey(qrId ?? 0),
    queryFn: (): Promise<MenuProfileApiItem> => getMenuByQrIdRequest(qrId as number),
    enabled: enabled && qrId != null && qrId > 0,
    staleTime: 30_000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function invalidateMenuByQr(queryClient: QueryClient, qrId?: number | string | null) {
  if (qrId != null) {
    return queryClient.invalidateQueries({ queryKey: menuByQrQueryKey(qrId) });
  }
  return queryClient.invalidateQueries({ queryKey: ["menuByQr"], exact: false });
}
