"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";

import {
  getPublicMenuProductsRequest,
  getPublicProductFacetsRequest,
  type MainCategoryApiItem,
} from "@/lib/api";
import { PUBLIC_MENU_STALE_TIME_MS } from "@/lib/public-menu-cache";

import { publicMenuKeys } from "./keys";
import type { PublicMenuCategoryStat } from "./types";

export function usePublicMenuCategoryStats(
  menuId: number,
  categories: MainCategoryApiItem[],
): Map<number, PublicMenuCategoryStat> {
  const facetQueries = useQueries({
    queries: categories.map((category) => ({
      queryKey: publicMenuKeys.categoryStats(menuId, category.id),
      queryFn: () => getPublicProductFacetsRequest(menuId, { mainCategoryId: category.id }),
      staleTime: PUBLIC_MENU_STALE_TIME_MS,
      enabled: menuId > 0 && category.id > 0,
    })),
  });

  const coverQueries = useQueries({
    queries: categories.map((category) => ({
      queryKey: publicMenuKeys.categoryCover(menuId, category.id),
      queryFn: async () => {
        const page = await getPublicMenuProductsRequest(menuId, {
          mainCategoryId: category.id,
          page: 0,
          size: 8,
        });
        return (page.content ?? []).find((product) => product.imageUrl)?.imageUrl ?? null;
      },
      staleTime: PUBLIC_MENU_STALE_TIME_MS,
      enabled: menuId > 0 && category.id > 0,
    })),
  });

  return useMemo(() => {
    const stats = new Map<number, PublicMenuCategoryStat>();
    categories.forEach((category, index) => {
      stats.set(category.id, {
        productCount: facetQueries[index]?.data?.totalMatching ?? 0,
        coverImageUrl: coverQueries[index]?.data ?? null,
      });
    });
    return stats;
  }, [categories, coverQueries, facetQueries]);
}

export function usePublicMenuCategoryStat(
  menuId: number,
  mainCategoryId: number,
  stats: Map<number, PublicMenuCategoryStat>,
): PublicMenuCategoryStat {
  return stats.get(mainCategoryId) ?? { productCount: 0, coverImageUrl: null };
}
