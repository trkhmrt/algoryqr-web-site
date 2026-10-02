"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import {
  publicMenuCategoryUrlId,
  publicMenuCategoryUrlName,
  resolveCategoryByUrlParam,
  resolveMainCategoryByNameLike,
  resolveMainCategoryByUrlParam,
  resolveSubCategoryByUrlParam,
  type TaxonomyNavNode,
} from "../types";

import {
  PUBLIC_MENU_CATEGORY_NAME_PARAM,
  type PublicMenuUrlViewBase,
} from "./use-public-menu-url-state";

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

function resolveMainFromLink(
  categories: TaxonomyNavNode[],
  categoryName: string | null,
  categoryId: number | null,
): TaxonomyNavNode | null {
  if (categoryName) {
    const byName = resolveMainCategoryByNameLike(categories, categoryName);
    if (byName) return byName;
  }
  if (categoryId != null) {
    return resolveMainCategoryByUrlParam(categories, categoryId);
  }
  return null;
}

export function usePublicMenuActiveCategory({
  categories,
  view,
  replaceView,
  supportsSubCategory = false,
}: UsePublicMenuActiveCategoryArgs): {
  activeCategoryId: number | null;
  activeSubCategoryId: number | null;
  activeMainCategory: TaxonomyNavNode | null;
  activeCategory: TaxonomyNavNode | null;
} {
  const searchParams = useSearchParams();

  const linkCategoryName = useMemo(() => {
    const raw = searchParams.get(PUBLIC_MENU_CATEGORY_NAME_PARAM);
    const trimmed = raw?.trim();
    return trimmed ? trimmed : null;
  }, [searchParams]);

  const linkCategoryId = useMemo(
    () => parseLinkId(searchParams.get("categoryId")),
    [searchParams],
  );
  const linkSubCategoryId = useMemo(() => {
    if (!supportsSubCategory) return null;
    return parseLinkId(searchParams.get("subCategoryId"));
  }, [searchParams, supportsSubCategory]);

  const viewCategoryName = useMemo(() => {
    if (view.type === "category") return view.categoryName?.trim() || null;
    if (view.type === "product") return view.categoryName?.trim() || null;
    return null;
  }, [view]);

  const rawCategoryName = useMemo(() => {
    if (linkCategoryName != null) return linkCategoryName;
    return viewCategoryName;
  }, [linkCategoryName, viewCategoryName]);

  const rawCategoryId = useMemo(() => {
    if (linkCategoryId != null) return linkCategoryId;
    if (view.type === "category" && view.categoryId > 0) return view.categoryId;
    if (view.type === "product" && view.categoryId != null && view.categoryId > 0) {
      return view.categoryId;
    }
    return null;
  }, [linkCategoryId, view]);

  const rawSubCategoryId = useMemo(() => {
    if (linkSubCategoryId != null) return linkSubCategoryId;
    if (view.type === "category") return view.subCategoryId ?? null;
    if (view.type === "product") return view.subCategoryId ?? null;
    return null;
  }, [linkSubCategoryId, view]);

  const activeMainCategory = useMemo(() => {
    return resolveMainFromLink(categories, rawCategoryName, rawCategoryId);
  }, [categories, rawCategoryName, rawCategoryId]);

  const activeSubCategoryId = useMemo(() => {
    if (rawSubCategoryId != null && activeMainCategory) {
      const sub = resolveSubCategoryByUrlParam(activeMainCategory, rawSubCategoryId);
      if (sub) return sub.subCategoryId;
    }
    if (rawCategoryId != null) {
      const resolved = resolveCategoryByUrlParam(categories, rawCategoryId);
      if (resolved?.kind === "sub") return resolved.subCategoryId;
    }
    return rawSubCategoryId;
  }, [activeMainCategory, categories, rawCategoryId, rawSubCategoryId]);

  useEffect(() => {
    const hasLink = linkCategoryName != null || linkCategoryId != null;
    if (!hasLink) return;
    if (view.type === "product" && parseLinkId(searchParams.get("productId")) != null) {
      return;
    }

    const main = resolveMainFromLink(categories, linkCategoryName, linkCategoryId);
    if (!main) return;

    const canonicalId = publicMenuCategoryUrlId(main);
    const canonicalName = publicMenuCategoryUrlName(main);
    const subCategoryId = supportsSubCategory ? linkSubCategoryId : null;

    if (
      view.type === "category" &&
      view.categoryId === canonicalId &&
      (view.categoryName ?? null) === canonicalName &&
      (view.subCategoryId ?? null) === subCategoryId
    ) {
      return;
    }

    replaceView({
      type: "category",
      categoryId: canonicalId,
      categoryName: canonicalName,
      subCategoryId,
    });
  }, [
    categories,
    linkCategoryId,
    linkCategoryName,
    linkSubCategoryId,
    replaceView,
    searchParams,
    supportsSubCategory,
    view,
  ]);

  useEffect(() => {
    if (view.type !== "category" || !activeMainCategory) return;
    const canonicalId = publicMenuCategoryUrlId(activeMainCategory);
    const canonicalName = publicMenuCategoryUrlName(activeMainCategory);
    if (view.categoryId === canonicalId && (view.categoryName ?? null) === canonicalName) {
      return;
    }
    replaceView({
      type: "category",
      categoryId: canonicalId,
      categoryName: canonicalName,
      subCategoryId: view.subCategoryId ?? null,
    });
  }, [activeMainCategory, replaceView, view]);

  useEffect(() => {
    if (view.type !== "product" || !activeMainCategory || view.categoryId == null) return;
    const canonicalId = publicMenuCategoryUrlId(activeMainCategory);
    const canonicalName = publicMenuCategoryUrlName(activeMainCategory);
    if (view.categoryId === canonicalId && (view.categoryName ?? null) === canonicalName) {
      return;
    }
    replaceView({
      type: "product",
      productId: view.productId,
      categoryId: canonicalId,
      categoryName: canonicalName,
      subCategoryId: view.subCategoryId ?? null,
    });
  }, [activeMainCategory, replaceView, view]);

  return {
    activeCategoryId: activeMainCategory?.categoryId ?? rawCategoryId,
    activeSubCategoryId,
    activeMainCategory,
    activeCategory: activeMainCategory,
  };
}
