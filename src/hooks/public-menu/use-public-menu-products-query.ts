"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { getPublicMenuProductsRequest } from "@/lib/api";
import { PUBLIC_MENU_STALE_TIME_MS } from "@/lib/public-menu-cache";

import { publicMenuKeys } from "./keys";
import { toProductsInitialData, type PublicMenuProductsInitialPage } from "./types";

type UsePublicMenuProductsArgs = {
  publicId: string;
  pageSize?: number;
  initial: PublicMenuProductsInitialPage;
  enabled?: boolean;
};

export function usePublicMenuProductsQuery({
  publicId,
  pageSize = 20,
  initial,
  enabled = true,
}: UsePublicMenuProductsArgs) {
  return useInfiniteQuery({
    queryKey: publicMenuKeys.products(publicId),
    enabled: enabled && publicId.length > 0,
    initialData: toProductsInitialData(initial),
    initialPageParam: initial.page,
    staleTime: PUBLIC_MENU_STALE_TIME_MS,
    queryFn: ({ pageParam }) =>
      getPublicMenuProductsRequest(publicId, pageParam as number, pageSize),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  });
}
