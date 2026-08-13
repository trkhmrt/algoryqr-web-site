"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getMenuTaxonomyPageRequest,
  type MainCategoryApiItem,
} from "@/lib/api";

export type MenuCategoryFeedValue = {
  categories: MainCategoryApiItem[];
  hasNext: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<void>;
};

const MenuCategoryFeedContext = createContext<MenuCategoryFeedValue | null>(null);

type UseMenuCategoryFeedStateArgs = {
  initialCategories: MainCategoryApiItem[];
  initialPage?: number;
  initialSize?: number;
  initialHasNext?: boolean;
};

export function useMenuCategoryFeedState({
  initialCategories,
  initialPage = 0,
  initialSize = 6,
  initialHasNext = false,
}: UseMenuCategoryFeedStateArgs): MenuCategoryFeedValue {
  const [categories, setCategories] = useState(initialCategories);
  const [page, setPage] = useState(initialPage);
  const [hasNext, setHasNext] = useState(initialHasNext);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  const fetchNextPage = useCallback(async () => {
    if (!hasNext || isFetchingNextPage) return;
    setIsFetchingNextPage(true);
    try {
      const nextPage = page + 1;
      const response = await getMenuTaxonomyPageRequest({ page: nextPage, size: initialSize });
      setCategories((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        const appended = (response.content ?? []).filter((item) => !seen.has(item.id));
        return appended.length > 0 ? [...prev, ...appended] : prev;
      });
      setPage(response.page ?? nextPage);
      setHasNext(Boolean(response.hasNext));
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [hasNext, initialSize, isFetchingNextPage, page]);

  return useMemo(
    () => ({
      categories,
      hasNext,
      isFetchingNextPage,
      fetchNextPage,
    }),
    [categories, fetchNextPage, hasNext, isFetchingNextPage],
  );
}

export function MenuCategoryFeed({
  initialCategories,
  categoryPage = 0,
  categorySize = 6,
  categoryHasNext = false,
  children,
}: {
  initialCategories: MainCategoryApiItem[];
  categoryPage?: number;
  categorySize?: number;
  categoryHasNext?: boolean;
  categoryTotalElements?: number;
  children: ReactNode;
}) {
  const value = useMenuCategoryFeedState({
    initialCategories,
    initialPage: categoryPage,
    initialSize: categorySize,
    initialHasNext: categoryHasNext,
  });
  return (
    <MenuCategoryFeedContext.Provider value={value}>{children}</MenuCategoryFeedContext.Provider>
  );
}

export function useMenuCategoryFeed(): MenuCategoryFeedValue {
  const value = useContext(MenuCategoryFeedContext);
  if (!value) {
    return {
      categories: [],
      hasNext: false,
      isFetchingNextPage: false,
      fetchNextPage: async () => undefined,
    };
  }
  return value;
}
