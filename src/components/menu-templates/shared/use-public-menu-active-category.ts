"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import {
  publicMenuCategoryUrlId,
  resolveCategoryByUrlParam,
  resolveSubCategoryByUrlParam,
  type TaxonomyNavNode,
} from "../types";

import type { PublicMenuUrlViewBase } from "./use-public-menu-url-state";

function parseLinkId(param: string | null): number | null {
  if (!param) return null;
  const parsed = Number.parseInt(param, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

type UsePublicMenuActiveCategoryArgs = {
  categories: TaxonomyNavNode[];
  view: PublicMenuUrlViewBase;
  replaceView: (nextView: PublicMenuUrlViewBase) => void;
  supportsSubCategory?: boolean;
};

export function usePublicMenuActiveCategory({
  categories,
  view,
  replaceView,
  supportsSubCategory = false,
}: UsePublicMenuActiveCategoryArgs): {
  activeCategoryId: number | null;
  activeSubCategoryId: number | null;
  activeCategory: TaxonomyNavNode | null;
} {
  const searchParams = useSearchParams();

  const linkCategoryId = useMemo(
    () => parseLinkId(searchParams.get("categoryId")),
    [searchParams],
  );
  const linkSubCategoryId = useMemo(() => {
    if (!supportsSubCategory) return null;
    return parseLinkId(searchParams.get("subCategoryId"));
  }, [searchParams, supportsSubCategory]);

  const rawCategoryId = useMemo(() => {
    if (linkCategoryId != null) return linkCategoryId;
    if (view.type === "category") return view.categoryId;
    if (view.type === "product" && view.categoryId != null) return view.categoryId;
    return null;
  }, [linkCategoryId, view]);

  const rawSubCategoryId = useMemo(() => {
    if (linkSubCategoryId != null) return linkSubCategoryId;
    if (view.type === "category") return view.subCategoryId ?? null;
    if (view.type === "product") return view.subCategoryId ?? null;
    return null;
  }, [linkSubCategoryId, view]);

  const activeCategory = useMemo(() => {
    if (rawCategoryId == null) return null;
    const resolved = resolveCategoryByUrlParam(categories, rawCategoryId);
    if (resolved?.kind === "sub") return resolved;
    if (resolved?.kind === "main" && rawSubCategoryId != null) {
      return resolveSubCategoryByUrlParam(resolved, rawSubCategoryId) ?? resolved;
    }
    return resolved;
  }, [categories, rawCategoryId, rawSubCategoryId]);

  const activeMainCategory = useMemo(() => {
    if (!activeCategory) return null;
    if (activeCategory.kind === "main") return activeCategory;
    return (
      categories.find((node) =>
        node.kind === "main" && node.mainCategoryId === activeCategory.mainCategoryId,
      ) ?? null
    );
  }, [activeCategory, categories]);

  useEffect(() => {
    if (linkCategoryId == null) return;
    if (view.type === "product" && parseLinkId(searchParams.get("productId")) != null) {
      return;
    }

    const resolved = resolveCategoryByUrlParam(categories, linkCategoryId);
    if (!resolved) return;

    const main =
      resolved.kind === "main"
        ? resolved
        : categories.find(
            (node) => node.kind === "main" && node.mainCategoryId === resolved.mainCategoryId,
          ) ?? resolved;

    const canonicalId = publicMenuCategoryUrlId(main);
    const subCategoryId = supportsSubCategory
      ? resolved.kind === "sub"
        ? resolved.subCategoryId
        : linkSubCategoryId
      : null;

    if (
      view.type === "category" &&
      view.categoryId === canonicalId &&
      (view.subCategoryId ?? null) === subCategoryId
    ) {
      return;
    }

    replaceView({
      type: "category",
      categoryId: canonicalId,
      subCategoryId,
    });
  }, [categories, linkCategoryId, linkSubCategoryId, replaceView, searchParams, supportsSubCategory, view]);

  useEffect(() => {
    if (view.type !== "category" || !activeMainCategory) return;
    const canonicalId = publicMenuCategoryUrlId(activeMainCategory);
    if (view.categoryId === canonicalId) return;
    replaceView({
      type: "category",
      categoryId: canonicalId,
      subCategoryId: view.subCategoryId ?? null,
    });
  }, [activeMainCategory, replaceView, view]);

  useEffect(() => {
    if (view.type !== "product" || !activeMainCategory || view.categoryId == null) return;
    const canonicalId = publicMenuCategoryUrlId(activeMainCategory);
    if (view.categoryId === canonicalId) return;
    replaceView({
      type: "product",
      productId: view.productId,
      categoryId: canonicalId,
      subCategoryId: view.subCategoryId ?? null,
    });
  }, [activeMainCategory, replaceView, view]);

  const displayCategory =
    activeCategory?.kind === "sub" && activeMainCategory ? activeMainCategory : activeCategory;

  return {
    activeCategoryId: displayCategory?.categoryId ?? rawCategoryId,
    activeSubCategoryId:
      activeCategory?.kind === "sub"
        ? activeCategory.subCategoryId
        : rawSubCategoryId,
    activeCategory: displayCategory,
  };
}
