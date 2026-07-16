"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";

import type { AccessProfile } from "@/lib/auth-user";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";

export const ACCESS_PROFILE_QUERY_KEY = ["accessProfile"] as const;

export function useAccessProfile(enabled = true) {
  return useQuery({
    queryKey: ACCESS_PROFILE_QUERY_KEY,
    queryFn: async () => {
      const response = await getSiteSameOriginAxios().get<AccessProfile>("/auth/session");
      return response.data;
    },
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}

export function invalidateAccessProfile(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: ACCESS_PROFILE_QUERY_KEY });
}
