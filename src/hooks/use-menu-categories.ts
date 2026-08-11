"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";

import {
  getMenuCategoriesByQrRequest,
  getMenuCategoriesRequest,
  getMenuAllergensRequest,
  getMenuTagsRequest,
  getMenuTaxonomyPageRequest,
  getMenuTaxonomyRequest,
  type MainCategoryApiItem,
  type MenuAllergenApiItem,
  type MenuCategoriesByQrApiResponse,
  type MenuTagApiItem,
  type TaxonomyPageApiResponse,
} from "@/lib/api";

export const menuCategoriesQueryKey = (menuId: number | string) =>
  ["menuCategories", menuId] as const;
export const menuCategoriesByQrQueryKey = (qrId: number | string) =>
  ["menuCategoriesByQr", qrId] as const;
export const menuTaxonomyQueryKey = ["menuTaxonomy"] as const;
export const menuTaxonomyPageQueryKey = (page: number, size: number, q: string) =>
  ["menuTaxonomyPage", page, size, q] as const;
export const menuTagsQueryKey = ["menuTags"] as const;
export const menuAllergensQueryKey = ["menuAllergens"] as const;

export function useMenuCategories(menuId: number | null | undefined, enabled = true) {
  return useQuery({
    queryKey: menuCategoriesQueryKey(menuId ?? 0),
    queryFn: (): Promise<MainCategoryApiItem[]> => getMenuCategoriesRequest(menuId as number),
    enabled: enabled && menuId != null && menuId > 0,
    staleTime: 30_000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function useMenuCategoriesByQr(qrId: number | null | undefined, enabled = true) {
  return useQuery({
    queryKey: menuCategoriesByQrQueryKey(qrId ?? 0),
    queryFn: (): Promise<MenuCategoriesByQrApiResponse> =>
      getMenuCategoriesByQrRequest(qrId as number),
    enabled: enabled && qrId != null && qrId > 0,
    staleTime: 30_000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function useMenuTaxonomy(enabled = true) {
  return useQuery({
    queryKey: menuTaxonomyQueryKey,
    queryFn: (): Promise<MainCategoryApiItem[]> => getMenuTaxonomyRequest(),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function useMenuTaxonomyPage(
  options: { page?: number; size?: number; q?: string } = {},
  enabled = true,
) {
  const page = options.page ?? 0;
  const size = options.size ?? 5;
  const q = options.q?.trim() ?? "";
  return useQuery({
    queryKey: menuTaxonomyPageQueryKey(page, size, q),
    queryFn: (): Promise<TaxonomyPageApiResponse> =>
      getMenuTaxonomyPageRequest({ page, size, q: q || undefined }),
    enabled,
    staleTime: 30_000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function useMenuTags(enabled = true) {
  return useQuery({
    queryKey: menuTagsQueryKey,
    queryFn: (): Promise<MenuTagApiItem[]> => getMenuTagsRequest(),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function useMenuAllergens(enabled = true) {
  return useQuery({
    queryKey: menuAllergensQueryKey,
    queryFn: (): Promise<MenuAllergenApiItem[]> => getMenuAllergensRequest(),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function invalidateMenuCategories(
  queryClient: QueryClient,
  menuId?: number | string | null,
  qrId?: number | string | null,
) {
  const tasks: Promise<unknown>[] = [
    queryClient.invalidateQueries({ queryKey: menuTaxonomyQueryKey }),
    queryClient.invalidateQueries({ queryKey: ["menuTaxonomyPage"], exact: false }),
  ];
  if (menuId != null) {
    tasks.push(queryClient.invalidateQueries({ queryKey: menuCategoriesQueryKey(menuId) }));
  }
  if (qrId != null) {
    tasks.push(queryClient.invalidateQueries({ queryKey: menuCategoriesByQrQueryKey(qrId) }));
  }
  if (menuId == null && qrId == null) {
    tasks.push(queryClient.invalidateQueries({ queryKey: ["menuCategories"], exact: false }));
    tasks.push(queryClient.invalidateQueries({ queryKey: ["menuCategoriesByQr"], exact: false }));
  }
  return Promise.all(tasks);
}
