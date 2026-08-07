"use client";

import { useCallback, useMemo, useState } from "react";

import type { MenuVisitAnalytics } from "@/hooks/use-menu-visit-analytics";
import type { MenuProductApiItem } from "@/lib/api";

import type { MenuNavCategory } from "../types";

export type MenuBrowseView = {
  type: "browse";
  categoryKey: string | null;
};

export type MenuProductView = {
  type: "product";
  productId: number;
  categoryKey: string | null;
};

export type MenuTemplateView = MenuBrowseView | MenuProductView;

type UseMenuTemplateNavArgs = {
  navCategories: MenuNavCategory[];
  products: MenuProductApiItem[];
  analytics?: MenuVisitAnalytics;
  defaultCategoryKey?: string | null;
};

export function useMenuTemplateNav({
  navCategories,
  products,
  analytics,
  defaultCategoryKey = null,
}: UseMenuTemplateNavArgs) {
  const initialKey = defaultCategoryKey ?? navCategories[0]?.key ?? null;

  const [view, setView] = useState<MenuTemplateView>({
    type: "browse",
    categoryKey: initialKey,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedProduct, setPinnedProduct] = useState<MenuProductApiItem | null>(null);

  const activeCategoryKey =
    view.type === "browse" || view.type === "product" ? view.categoryKey : null;

  const activeCategory = useMemo(
    () =>
      activeCategoryKey
        ? navCategories.find((c) => c.key === activeCategoryKey) ?? null
        : null,
    [activeCategoryKey, navCategories],
  );

  const selectedProduct = useMemo(() => {
    if (view.type !== "product") return null;
    return (
      products.find((p) => p.productId === view.productId) ??
      (pinnedProduct?.productId === view.productId ? pinnedProduct : null)
    );
  }, [view, products, pinnedProduct]);

  const goHome = useCallback(() => {
    setSearchQuery("");
    setPinnedProduct(null);
    setView({
      type: "browse",
      categoryKey: navCategories[0]?.key ?? null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [navCategories]);

  const selectCategory = useCallback(
    (category: MenuNavCategory) => {
      setPinnedProduct(null);
      setView({ type: "browse", categoryKey: category.key });
      const trackId = category.subCategoryId ?? category.mainCategoryId;
      if (trackId != null) analytics?.trackCategoryView(trackId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [analytics],
  );

  const openProduct = useCallback(
    (product: MenuProductApiItem, categoryKey?: string | null) => {
      const key =
        categoryKey ??
        activeCategoryKey ??
        navCategories.find((c) => c.subCategoryId === product.subCategoryId)?.key ??
        navCategories.find((c) => c.mainCategoryId === product.mainCategoryId)?.key ??
        null;
      setPinnedProduct(product);
      setView({
        type: "product",
        productId: product.productId,
        categoryKey: key,
      });
      analytics?.trackProductView(product.productId, product.subCategoryId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [activeCategoryKey, analytics, navCategories],
  );

  const goBack = useCallback(() => {
    if (view.type === "product") {
      setPinnedProduct(null);
      setView({ type: "browse", categoryKey: view.categoryKey });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    goHome();
  }, [view, goHome]);

  return {
    view,
    searchQuery,
    setSearchQuery,
    activeCategory,
    activeCategoryKey,
    selectedProduct,
    isProductView: view.type === "product",
    goHome,
    selectCategory,
    openProduct,
    goBack,
  };
}
