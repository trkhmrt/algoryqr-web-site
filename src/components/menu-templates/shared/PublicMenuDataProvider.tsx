"use client";

import { useCallback, useEffect, useMemo, type ReactNode } from "react";

import type { MainCategoryApiItem, MenuProductApiItem } from "@/lib/api";
import { usePublicMenuCategories } from "@/hooks/public-menu/use-public-menu-categories";
import { usePublicMenuCategoryStats } from "@/hooks/public-menu/use-public-menu-category-stats";
import { usePublicMenuProductsQuery } from "@/hooks/public-menu/use-public-menu-products-query";
import { useSyncPublicMenuPage } from "@/hooks/public-menu/use-sync-public-menu-pages";
import {
  flattenCategoryPages,
  flattenProductPages,
  type PublicMenuCategoriesInitialPage,
  type PublicMenuProductsInitialPage,
} from "@/hooks/public-menu/types";
import {
  collectMenuContentTexts,
  localizeCategories,
  localizeProducts,
} from "@/lib/menu-content-i18n";
import { useGoogleTranslateOptional } from "@/components/google-translate-provider";

import { MenuCategoryFeedContext, type MenuCategoryFeedValue } from "./MenuCategoryFeed";
import {
  MenuProductFeedContext,
  type MenuProductFeedValue,
} from "./use-public-menu-products";

const EMPTY_DICT: Record<string, string> = {};

export type PublicMenuDataProviderProps = {
  menuId: number;
  initialCategories: MainCategoryApiItem[];
  initialProducts: MenuProductApiItem[];
  categoryPage?: number;
  categorySize?: number;
  categoryHasNext?: boolean;
  productPage?: number;
  productSize?: number;
  productHasNext?: boolean;
  children: ReactNode;
};

export function PublicMenuDataProvider({
  menuId,
  initialCategories,
  initialProducts,
  categoryPage = 0,
  categorySize = 50,
  categoryHasNext = false,
  productPage = 0,
  productSize = 20,
  productHasNext = false,
  children,
}: PublicMenuDataProviderProps) {
  const categoriesInitial = useMemo<PublicMenuCategoriesInitialPage>(
    () => ({
      content: initialCategories,
      page: categoryPage,
      size: categorySize,
      hasNext: categoryHasNext,
    }),
    [categoryHasNext, categoryPage, categorySize, initialCategories],
  );

  const productsInitial = useMemo<PublicMenuProductsInitialPage>(
    () => ({
      content: initialProducts,
      page: productPage,
      size: productSize,
      hasNext: productHasNext,
    }),
    [initialProducts, productHasNext, productPage, productSize],
  );

  const categoryQuery = usePublicMenuCategories({
    menuId,
    pageSize: categorySize,
    initial: categoriesInitial,
  });

  const productQuery = usePublicMenuProductsQuery({
    menuId,
    pageSize: productSize,
    initial: productsInitial,
  });

  useSyncPublicMenuPage(categoryQuery);
  useSyncPublicMenuPage(productQuery);

  const categories = useMemo(
    () => flattenCategoryPages(categoryQuery.data),
    [categoryQuery.data],
  );

  const products = useMemo(() => flattenProductPages(productQuery.data), [productQuery.data]);

  const i18n = useGoogleTranslateOptional();
  const ensureTranslations = i18n?.ensureTranslations;
  const dict = i18n?.dict ?? EMPTY_DICT;
  const contentTexts = useMemo(
    () => collectMenuContentTexts(products, categories),
    [categories, products],
  );

  useEffect(() => {
    void ensureTranslations?.(contentTexts);
  }, [contentTexts, ensureTranslations]);

  const localizedCategories = useMemo(
    () => localizeCategories(categories, dict),
    [categories, dict],
  );

  const localizedProducts = useMemo(
    () => localizeProducts(products, dict),
    [dict, products],
  );

  usePublicMenuCategoryStats(menuId, categories);

  const fetchCategoryNextPage = useCallback(async () => {
    await categoryQuery.fetchNextPage();
  }, [categoryQuery]);

  const fetchProductNextPage = useCallback(async () => {
    await productQuery.fetchNextPage();
  }, [productQuery]);

  const categoryFeedValue = useMemo<MenuCategoryFeedValue>(
    () => ({
      categories: localizedCategories,
      hasNext: Boolean(categoryQuery.hasNextPage),
      isFetchingNextPage: categoryQuery.isFetchingNextPage,
      fetchNextPage: fetchCategoryNextPage,
    }),
    [
      localizedCategories,
      categoryQuery.hasNextPage,
      categoryQuery.isFetchingNextPage,
      fetchCategoryNextPage,
    ],
  );

  const productFeedValue = useMemo<MenuProductFeedValue>(
    () => ({
      products: localizedProducts,
      hasNext: Boolean(productQuery.hasNextPage),
      isFetchingNextPage: productQuery.isFetchingNextPage,
      fetchNextPage: fetchProductNextPage,
    }),
    [
      fetchProductNextPage,
      productQuery.hasNextPage,
      productQuery.isFetchingNextPage,
      localizedProducts,
    ],
  );

  return (
    <MenuCategoryFeedContext.Provider value={categoryFeedValue}>
      <MenuProductFeedContext.Provider value={productFeedValue}>
        {children}
      </MenuProductFeedContext.Provider>
    </MenuCategoryFeedContext.Provider>
  );
}
