"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { TaxonomyNavNode } from "../types";
import { publicMenuCategoryUrlId, publicMenuCategoryUrlName } from "../types";

const TABLE_TOKEN_PARAM = "t";
export const PUBLIC_MENU_CATEGORY_NAME_PARAM = "category";
const CATEGORY_ID_PARAM = "categoryId";
const SUB_CATEGORY_ID_PARAM = "subCategoryId";
const PRODUCT_ID_PARAM = "productId";

const PRESERVED_PARAMS = new Set([TABLE_TOKEN_PARAM]);

export type PublicMenuUrlViewBase =
  | { type: "home" }
  | {
      type: "category";
      categoryId: number;
      categoryName?: string | null;
      subCategoryId?: number | null;
    }
  | {
      type: "product";
      productId: number;
      categoryId: number | null;
      categoryName?: string | null;
      subCategoryId?: number | null;
    };

type UrlSyncMode = "push" | "replace";

export type PublicMenuViewNavigation = {
  replaceView: (nextView: PublicMenuUrlViewBase) => void;
  goBack: () => void;
};

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function readCategoryNameParam(searchParams: URLSearchParams): string | null {
  const raw = searchParams.get(PUBLIC_MENU_CATEGORY_NAME_PARAM);
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}

export function publicMenuCategoryView(
  category: TaxonomyNavNode,
  subCategoryId?: number | null,
): Extract<PublicMenuUrlViewBase, { type: "category" }> {
  return {
    type: "category",
    categoryId: publicMenuCategoryUrlId(category),
    categoryName: publicMenuCategoryUrlName(category),
    subCategoryId: subCategoryId ?? null,
  };
}

export function parsePublicMenuViewFromSearchParams(
  searchParams: URLSearchParams,
  supportsSubCategory = false,
): PublicMenuUrlViewBase | null {
  const productId = parsePositiveInt(searchParams.get(PRODUCT_ID_PARAM));
  const categoryId = parsePositiveInt(searchParams.get(CATEGORY_ID_PARAM));
  const categoryName = readCategoryNameParam(searchParams);
  const subCategoryId = supportsSubCategory
    ? parsePositiveInt(searchParams.get(SUB_CATEGORY_ID_PARAM))
    : null;

  if (productId != null) {
    return {
      type: "product",
      productId,
      categoryId,
      categoryName,
      subCategoryId,
    };
  }

  if (categoryName != null) {
    return {
      type: "category",
      categoryId: categoryId ?? 0,
      categoryName,
      subCategoryId: supportsSubCategory ? subCategoryId : null,
    };
  }

  if (categoryId != null) {
    return {
      type: "category",
      categoryId,
      subCategoryId: supportsSubCategory ? subCategoryId : null,
    };
  }

  return null;
}

function buildSearchParamsForView(
  view: PublicMenuUrlViewBase,
  current: URLSearchParams,
  supportsSubCategory: boolean,
): URLSearchParams {
  const next = new URLSearchParams();

  for (const [key, value] of current.entries()) {
    if (PRESERVED_PARAMS.has(key)) {
      next.set(key, value);
    }
  }

  if (view.type === "category") {
    const name = view.categoryName?.trim();
    if (name) {
      next.set(PUBLIC_MENU_CATEGORY_NAME_PARAM, name);
    } else if (view.categoryId > 0) {
      next.set(CATEGORY_ID_PARAM, String(view.categoryId));
    }
    if (supportsSubCategory && view.subCategoryId != null) {
      next.set(SUB_CATEGORY_ID_PARAM, String(view.subCategoryId));
    }
    return next;
  }

  if (view.type === "product") {
    next.set(PRODUCT_ID_PARAM, String(view.productId));
    const name = view.categoryName?.trim();
    if (name) {
      next.set(PUBLIC_MENU_CATEGORY_NAME_PARAM, name);
    } else if (view.categoryId != null) {
      next.set(CATEGORY_ID_PARAM, String(view.categoryId));
    }
    if (supportsSubCategory && view.subCategoryId != null) {
      next.set(SUB_CATEGORY_ID_PARAM, String(view.subCategoryId));
    }
    return next;
  }

  return next;
}

function viewsEqual(a: PublicMenuUrlViewBase, b: PublicMenuUrlViewBase): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "home" && b.type === "home") return true;
  if (a.type === "category" && b.type === "category") {
    return (
      a.categoryId === b.categoryId &&
      (a.categoryName ?? null) === (b.categoryName ?? null) &&
      (a.subCategoryId ?? null) === (b.subCategoryId ?? null)
    );
  }
  if (a.type === "product" && b.type === "product") {
    return (
      a.productId === b.productId &&
      (a.categoryId ?? null) === (b.categoryId ?? null) &&
      (a.categoryName ?? null) === (b.categoryName ?? null) &&
      (a.subCategoryId ?? null) === (b.subCategoryId ?? null)
    );
  }
  return false;
}

function searchParamsEqual(a: URLSearchParams, b: URLSearchParams): boolean {
  return a.toString() === b.toString();
}

type UsePublicMenuViewStateOptions = {
  supportsSubCategory?: boolean;
};

function readViewFromSearchParams(
  searchParams: URLSearchParams,
  supportsSubCategory: boolean,
  defaultView: PublicMenuUrlViewBase,
): PublicMenuUrlViewBase {
  return (
    parsePublicMenuViewFromSearchParams(searchParams, supportsSubCategory) ?? defaultView
  );
}

export function usePublicMenuViewState<T extends PublicMenuUrlViewBase>(
  defaultView: T,
  options: UsePublicMenuViewStateOptions = {},
): [T, React.Dispatch<React.SetStateAction<T>>, PublicMenuViewNavigation] {
  const supportsSubCategory = options.supportsSubCategory ?? false;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [view, setView] = useState<T>(() =>
    readViewFromSearchParams(searchParams, supportsSubCategory, defaultView) as T,
  );
  const viewRef = useRef(view);
  const skipViewToUrlSync = useRef(true);
  const urlSyncModeRef = useRef<UrlSyncMode>("push");

  viewRef.current = view;

  useEffect(() => {
    const fromUrl = readViewFromSearchParams(searchParams, supportsSubCategory, defaultView);

    if (viewsEqual(fromUrl, viewRef.current)) {
      skipViewToUrlSync.current = false;
      return;
    }

    skipViewToUrlSync.current = true;
    setView(fromUrl as T);
  }, [defaultView, searchParams, supportsSubCategory]);

  useEffect(() => {
    if (skipViewToUrlSync.current) {
      skipViewToUrlSync.current = false;
      return;
    }

    const desired = buildSearchParamsForView(view, searchParams, supportsSubCategory);
    if (searchParamsEqual(desired, searchParams)) return;

    const query = desired.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    const mode = urlSyncModeRef.current;
    urlSyncModeRef.current = "push";

    if (mode === "replace") {
      router.replace(url, { scroll: false });
      return;
    }

    router.push(url, { scroll: false });
  }, [view, pathname, router, searchParams, supportsSubCategory]);

  const setViewWithPush = useCallback<React.Dispatch<React.SetStateAction<T>>>((value) => {
    urlSyncModeRef.current = "push";
    skipViewToUrlSync.current = false;
    setView(value);
  }, []);

  const replaceView = useCallback(
    (nextView: PublicMenuUrlViewBase) => {
      urlSyncModeRef.current = "replace";
      skipViewToUrlSync.current = false;
      setView(nextView as T);
    },
    [],
  );

  const goBack = useCallback(() => {
    skipViewToUrlSync.current = true;
    router.back();
  }, [router]);

  return [view, setViewWithPush, { replaceView, goBack }];
}
