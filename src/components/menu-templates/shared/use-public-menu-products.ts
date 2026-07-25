"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  getPublicMenuProductsRequest,
  type MenuProductApiItem,
} from "@/lib/api";

export type MenuProductFeedValue = {
  products: MenuProductApiItem[];
  hasNext: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<void>;
};

export const MenuProductFeedContext = createContext<MenuProductFeedValue | null>(null);

type UseMenuProductFeedStateArgs = {
  menuId: number;
  initialProducts: MenuProductApiItem[];
  initialPage?: number;
  initialSize?: number;
  initialHasNext?: boolean;
};

export function useMenuProductFeedState({
  menuId,
  initialProducts,
  initialPage = 0,
  initialSize = 20,
  initialHasNext = false,
}: UseMenuProductFeedStateArgs): MenuProductFeedValue {
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(initialPage);
  const [hasNext, setHasNext] = useState(initialHasNext);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  const fetchNextPage = useCallback(async () => {
    if (!hasNext || isFetchingNextPage) return;
    setIsFetchingNextPage(true);
    try {
      const nextPage = page + 1;
      const response = await getPublicMenuProductsRequest(menuId, nextPage, initialSize);
      setProducts((prev) => {
        const seen = new Set(prev.map((item) => item.productId));
        const appended = (response.content ?? []).filter((item) => !seen.has(item.productId));
        return appended.length > 0 ? [...prev, ...appended] : prev;
      });
      setPage(response.page ?? nextPage);
      setHasNext(Boolean(response.hasNext));
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [hasNext, isFetchingNextPage, page, menuId, initialSize]);

  return useMemo<MenuProductFeedValue>(
    () => ({
      products,
      hasNext,
      isFetchingNextPage,
      fetchNextPage,
    }),
    [products, hasNext, isFetchingNextPage, fetchNextPage],
  );
}

export function useMenuProductFeed(): MenuProductFeedValue {
  const value = useContext(MenuProductFeedContext);
  if (!value) {
    return {
      products: [],
      hasNext: false,
      isFetchingNextPage: false,
      fetchNextPage: async () => undefined,
    };
  }
  return value;
}

export function usePublicMenuProducts() {
  return useMenuProductFeed();
}
