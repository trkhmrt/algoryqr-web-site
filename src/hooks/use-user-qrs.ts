"use client";

import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { mapUserQrToDashboardItem, type DashboardQrItem } from "@/components/dashboard/qr/qr-mappers";
import { getUserQrsRequest } from "@/lib/api";

export const userQrsQueryKey = (userId: string, includeImage = false) =>
  ["userQrs", userId, includeImage ? "withImage" : "noImage"] as const;

export function useUserQrs(
  userId: string | undefined,
  options?: { includeImage?: boolean },
) {
  const id = userId?.trim() || "me";
  const includeImage = options?.includeImage === true;
  return useQuery({
    queryKey: userQrsQueryKey(id, includeImage),
    queryFn: async (): Promise<DashboardQrItem[]> => {
      const response = await getUserQrsRequest(id, { includeImage });
      return response.map(mapUserQrToDashboardItem);
    },
    enabled: true,
    staleTime: 30_000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function invalidateUserQrs(queryClient: QueryClient, userId?: string | undefined) {
  const id = userId?.trim() || "me";
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["userQrs", id], exact: false }),
    queryClient.invalidateQueries({ queryKey: ["userQrs", "me"], exact: false }),
  ]);
}
