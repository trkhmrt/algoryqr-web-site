"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";

import {
  getMenuCategoriesByQrRequest,
  getMenuCategoriesRequest,
  getMenuAllergensRequest,
  getMenuTagsRequest,
  type MainCategoryApiItem,
  type MenuAllergenApiItem,
  type MenuCategoriesByQrApiResponse,
  type MenuTagApiItem,
} from "@/lib/api";

export const menuCategoriesQueryKey = (menuId: number | string) =>
  ["menuCategories", menuId] as const;
export const menuCategoriesByQrQueryKey = (qrId: number | string) =>
  ["menuCategoriesByQr", qrId] as const;
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
  const tasks: Promise<unknown>[] = [];
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
