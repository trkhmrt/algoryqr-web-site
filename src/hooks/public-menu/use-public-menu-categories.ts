"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { getPublicMenuCategoriesRequest } from "@/lib/api";
import { PUBLIC_MENU_STALE_TIME_MS } from "@/lib/public-menu-cache";

import { publicMenuKeys } from "./keys";
import { toCategoriesInitialData, type PublicMenuCategoriesInitialPage } from "./types";

type UsePublicMenuCategoriesArgs = {
  menuId: number;
  pageSize?: number;
  initial: PublicMenuCategoriesInitialPage;
  enabled?: boolean;
};

export function usePublicMenuCategories({
  menuId,
  pageSize = 50,
  initial,
  enabled = true,
}: UsePublicMenuCategoriesArgs) {
  return useInfiniteQuery({
    queryKey: publicMenuKeys.categories(menuId),
    enabled: enabled && menuId > 0,
    initialData: toCategoriesInitialData(initial),
    initialPageParam: initial.page,
    staleTime: PUBLIC_MENU_STALE_TIME_MS,
    queryFn: ({ pageParam }) =>
      getPublicMenuCategoriesRequest(menuId, pageParam as number, pageSize),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  });
}
