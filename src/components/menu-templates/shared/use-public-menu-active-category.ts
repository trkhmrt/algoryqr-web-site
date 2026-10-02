"use client";

import { useEffect, useMemo } from "react";

import {
  publicMenuCategoryUrlId,
  resolveCategoryByUrlParam,
  type TaxonomyNavNode,
} from "../types";

import type { PublicMenuUrlViewBase } from "./use-public-menu-url-state";

type UsePublicMenuActiveCategoryArgs = {
  categories: TaxonomyNavNode[];
  view: PublicMenuUrlViewBase;
  replaceView: (nextView: PublicMenuUrlViewBase) => void;
};

export function usePublicMenuActiveCategory({
  categories,
  view,
  replaceView,
}: UsePublicMenuActiveCategoryArgs): {
  activeCategoryId: number | null;
  activeCategory: TaxonomyNavNode | null;
} {
  const rawCategoryId =
    view.type === "category"
      ? view.categoryId
      : view.type === "product"
        ? view.categoryId
        : null;

  const activeCategory = useMemo(() => {
    if (rawCategoryId == null) return null;
    return resolveCategoryByUrlParam(categories, rawCategoryId);
  }, [categories, rawCategoryId]);

  useEffect(() => {
    if (view.type !== "category" || !activeCategory) return;
    const canonicalId = publicMenuCategoryUrlId(activeCategory);
    if (view.categoryId === canonicalId) return;
    replaceView({
      type: "category",
      categoryId: canonicalId,
      subCategoryId: view.subCategoryId ?? null,
    });
  }, [activeCategory, replaceView, view]);

  useEffect(() => {
    if (view.type !== "product" || !activeCategory || view.categoryId == null) return;
    const canonicalId = publicMenuCategoryUrlId(activeCategory);
    if (view.categoryId === canonicalId) return;
    replaceView({
      type: "product",
      productId: view.productId,
      categoryId: canonicalId,
      subCategoryId: view.subCategoryId ?? null,
    });
  }, [activeCategory, replaceView, view]);

  return {
    activeCategoryId: activeCategory?.categoryId ?? rawCategoryId,
    activeCategory,
  };
}
