"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { getPublicMenuProductsRequest } from "@/lib/api";
import { PUBLIC_MENU_STALE_TIME_MS } from "@/lib/public-menu-cache";

import { publicMenuKeys } from "./keys";
import { flattenProductPages } from "./types";
import { useSyncPublicMenuPage } from "./use-sync-public-menu-pages";

const CATEGORY_PAGE_SIZE = 50;

type UsePublicMenuCategoryProductsArgs = {
  publicId: string;
  mainCategoryId: number;
  enabled?: boolean;
};

export function usePublicMenuCategoryProducts({
  publicId,
  mainCategoryId,
  enabled = true,
}: UsePublicMenuCategoryProductsArgs) {
  const query = useInfiniteQuery({
    queryKey: publicMenuKeys.categoryProducts(publicId, mainCategoryId, null),
    enabled: enabled && publicId.length > 0 && mainCategoryId > 0,
    staleTime: PUBLIC_MENU_STALE_TIME_MS,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getPublicMenuProductsRequest(publicId, {
        page: pageParam as number,
        size: CATEGORY_PAGE_SIZE,
        mainCategoryId,
      }),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  });

  useSyncPublicMenuPage(query);

  const products = useMemo(() => flattenProductPages(query.data), [query.data]);

  return {
    products,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    hasNext: Boolean(query.hasNextPage),
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}
