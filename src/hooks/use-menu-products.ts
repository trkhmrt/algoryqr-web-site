"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";

import {
  getMenuProductsByQrRequest,
  getMenuProductsPageRequest,
  getMenuProductsRequest,
  type MenuProductApiItem,
  type MenuProductPageApiResponse,
  type MenuProductsByQrApiResponse,
  type MenuProductsByQrQuery,
} from "@/lib/api";

export const menuProductsQueryKey = (menuId: number | string) => ["menuProducts", menuId] as const;
export const menuProductsPageQueryKey = (
  menuId: number | string,
  options: MenuProductsByQrQuery = {},
) => ["menuProductsPage", menuId, options] as const;
export const menuProductsByQrQueryKey = (
  qrId: number | string,
  options: MenuProductsByQrQuery = {},
) => ["menuProductsByQr", qrId, options] as const;

export function useMenuProducts(menuId: number | null | undefined, enabled = true) {
  return useQuery({
    queryKey: menuProductsQueryKey(menuId ?? 0),
    queryFn: (): Promise<MenuProductApiItem[]> => getMenuProductsRequest(menuId as number),
    enabled: enabled && menuId != null && menuId > 0,
    staleTime: 30_000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function useMenuProductsPage(
  menuId: number | null | undefined,
  options: MenuProductsByQrQuery = {},
  enabled = true,
) {
  return useQuery({
    queryKey: menuProductsPageQueryKey(menuId ?? 0, options),
    queryFn: (): Promise<MenuProductPageApiResponse> =>
      getMenuProductsPageRequest(menuId as number, options),
    enabled: enabled && menuId != null && menuId > 0,
    staleTime: 30_000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function useMenuProductsByQr(
  qrId: number | null | undefined,
  options: MenuProductsByQrQuery = {},
  enabled = true,
) {
  return useQuery({
    queryKey: menuProductsByQrQueryKey(qrId ?? 0, options),
    queryFn: (): Promise<MenuProductsByQrApiResponse> =>
      getMenuProductsByQrRequest(qrId as number, options),
    enabled: enabled && qrId != null && qrId > 0,
    staleTime: 30_000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function invalidateMenuProducts(
  queryClient: QueryClient,
  menuId?: number | string | null,
  qrId?: number | string | null,
) {
  const tasks: Promise<unknown>[] = [];
  if (menuId != null) {
    tasks.push(queryClient.invalidateQueries({ queryKey: menuProductsQueryKey(menuId) }));
    tasks.push(
      queryClient.invalidateQueries({ queryKey: ["menuProductsPage", menuId], exact: false }),
    );
  }
  if (qrId != null) {
    tasks.push(
      queryClient.invalidateQueries({ queryKey: ["menuProductsByQr", qrId], exact: false }),
    );
  }
  if (tasks.length === 0) {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ["menuProducts"], exact: false }),
      queryClient.invalidateQueries({ queryKey: ["menuProductsPage"], exact: false }),
      queryClient.invalidateQueries({ queryKey: ["menuProductsByQr"], exact: false }),
    ]);
  }
  return Promise.all(tasks);
}
