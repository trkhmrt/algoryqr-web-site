"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { MainCategoryApiItem } from "@/lib/api";

export type MenuCategoryFeedValue = {
  categories: MainCategoryApiItem[];
  hasNext: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<void>;
};

const MenuCategoryFeedContext = createContext<MenuCategoryFeedValue | null>(null);

export function useMenuCategoryFeedState({
  initialCategories,
}: {
  initialCategories: MainCategoryApiItem[];
}): MenuCategoryFeedValue {
  const [categories] = useState(initialCategories);
  const fetchNextPage = useCallback(async () => undefined, []);

  return useMemo(
    () => ({
      categories,
      hasNext: false,
      isFetchingNextPage: false,
      fetchNextPage,
    }),
    [categories, fetchNextPage],
  );
}

export function MenuCategoryFeed({
  initialCategories,
  children,
}: {
  initialCategories: MainCategoryApiItem[];
  categoryPage?: number;
  categorySize?: number;
  categoryHasNext?: boolean;
  categoryTotalElements?: number;
  children: ReactNode;
}) {
  const value = useMenuCategoryFeedState({ initialCategories });
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
