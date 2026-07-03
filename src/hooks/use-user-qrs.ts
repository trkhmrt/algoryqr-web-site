"use client";

import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { mapUserQrToDashboardItem, type DashboardQrItem } from "@/components/dashboard/qr/qr-mappers";
import { getUserQrsRequest } from "@/lib/api";

export const userQrsQueryKey = (userId: string) => ["userQrs", userId] as const;

export function useUserQrs(userId: string | undefined) {
  const id = userId?.trim() || "";
  return useQuery({
    queryKey: userQrsQueryKey(id || "anonymous"),
    queryFn: async (): Promise<DashboardQrItem[]> => {
      const response = await getUserQrsRequest(id);
      return response.map(mapUserQrToDashboardItem);
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function invalidateUserQrs(queryClient: QueryClient, userId: string | undefined) {
  const id = userId?.trim();
  if (!id) return Promise.resolve();
  return queryClient.invalidateQueries({ queryKey: userQrsQueryKey(id) });
}
