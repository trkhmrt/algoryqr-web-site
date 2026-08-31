import type { InfiniteData } from "@tanstack/react-query";

import type {
  MainCategoryApiItem,
  MenuCategoryPageApiResponse,
  MenuProductApiItem,
  MenuProductPageApiResponse,
} from "@/lib/api";

export type PublicMenuCategoriesInitialPage = {
  content: MainCategoryApiItem[];
  page: number;
  size: number;
  hasNext: boolean;
};

export type PublicMenuProductsInitialPage = {
  content: MenuProductApiItem[];
  page: number;
  size: number;
  hasNext: boolean;
};

export type PublicMenuCategoryStat = {
  productCount: number;
  coverImageUrl: string | null;
};

export function flattenCategoryPages(
  data: InfiniteData<MenuCategoryPageApiResponse> | undefined,
): MainCategoryApiItem[] {
  if (!data) return [];
  const seen = new Set<number>();
  const items: MainCategoryApiItem[] = [];
  for (const page of data.pages) {
    for (const category of page.content ?? []) {
      if (seen.has(category.id)) continue;
      seen.add(category.id);
      items.push(category);
    }
  }
  return items.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

export function flattenProductPages(
  data: InfiniteData<MenuProductPageApiResponse> | undefined,
): MenuProductApiItem[] {
  if (!data) return [];
  const seen = new Set<number>();
  const items: MenuProductApiItem[] = [];
  for (const page of data.pages) {
    for (const product of page.content ?? []) {
      if (seen.has(product.productId)) continue;
      seen.add(product.productId);
      items.push(product);
    }
  }
  return items.sort((a, b) => a.sortOrder - b.sortOrder || a.productId - b.productId);
}

export function toCategoriesInitialData(
  initial: PublicMenuCategoriesInitialPage,
): InfiniteData<MenuCategoryPageApiResponse> {
  return {
    pages: [
      {
        content: initial.content,
        page: initial.page,
        size: initial.size,
        totalElements: initial.content.length,
        totalPages: initial.hasNext ? 2 : 1,
        hasNext: initial.hasNext,
      },
    ],
    pageParams: [initial.page],
  };
}

export function toProductsInitialData(
  initial: PublicMenuProductsInitialPage,
): InfiniteData<MenuProductPageApiResponse> {
  return {
    pages: [
      {
        content: initial.content,
        page: initial.page,
        size: initial.size,
        totalElements: initial.content.length,
        totalPages: initial.hasNext ? 2 : 1,
        hasNext: initial.hasNext,
      },
    ],
    pageParams: [initial.page],
  };
}
