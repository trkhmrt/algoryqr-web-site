"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { getPublicMenuProductsRequest } from "@/lib/api";

import { publicMenuKeys } from "./keys";
import { toProductsInitialData, type PublicMenuProductsInitialPage } from "./types";

type UsePublicMenuProductsArgs = {
  menuId: number;
  pageSize?: number;
  initial: PublicMenuProductsInitialPage;
  enabled?: boolean;
};

export function usePublicMenuProductsQuery({
  menuId,
  pageSize = 20,
  initial,
  enabled = true,
}: UsePublicMenuProductsArgs) {
  return useInfiniteQuery({
    queryKey: publicMenuKeys.products(menuId),
    enabled: enabled && menuId > 0,
    initialData: toProductsInitialData(initial),
    initialPageParam: initial.page,
    staleTime: 5 * 60 * 1000,
    queryFn: ({ pageParam }) =>
      getPublicMenuProductsRequest(menuId, pageParam as number, pageSize),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  });
}
