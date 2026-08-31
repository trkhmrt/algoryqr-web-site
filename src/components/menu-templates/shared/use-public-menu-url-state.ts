"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const TABLE_TOKEN_PARAM = "t";
const CATEGORY_ID_PARAM = "categoryId";
const SUB_CATEGORY_ID_PARAM = "subCategoryId";
const PRODUCT_ID_PARAM = "productId";

const PRESERVED_PARAMS = new Set([TABLE_TOKEN_PARAM]);

export type PublicMenuUrlViewBase =
  | { type: "home" }
  | { type: "category"; categoryId: number; subCategoryId?: number | null }
  | {
      type: "product";
      productId: number;
      categoryId: number | null;
      subCategoryId?: number | null;
    };

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function parsePublicMenuViewFromSearchParams(
  searchParams: URLSearchParams,
  supportsSubCategory = false,
): PublicMenuUrlViewBase | null {
  const productId = parsePositiveInt(searchParams.get(PRODUCT_ID_PARAM));
  const categoryId = parsePositiveInt(searchParams.get(CATEGORY_ID_PARAM));
  const subCategoryId = supportsSubCategory
    ? parsePositiveInt(searchParams.get(SUB_CATEGORY_ID_PARAM))
    : null;

  if (productId != null) {
    return {
      type: "product",
      productId,
      categoryId,
      subCategoryId,
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
    next.set(CATEGORY_ID_PARAM, String(view.categoryId));
    if (supportsSubCategory && view.subCategoryId != null) {
      next.set(SUB_CATEGORY_ID_PARAM, String(view.subCategoryId));
    }
    return next;
  }

  if (view.type === "product") {
    next.set(PRODUCT_ID_PARAM, String(view.productId));
    if (view.categoryId != null) {
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
      (a.subCategoryId ?? null) === (b.subCategoryId ?? null)
    );
  }
  if (a.type === "product" && b.type === "product") {
    return (
      a.productId === b.productId &&
      (a.categoryId ?? null) === (b.categoryId ?? null) &&
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

export function usePublicMenuViewState<T extends PublicMenuUrlViewBase>(
  defaultView: T,
  options: UsePublicMenuViewStateOptions = {},
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const supportsSubCategory = options.supportsSubCategory ?? false;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [view, setView] = useState<T>(defaultView);
  const viewRef = useRef(view);
  const skipViewToUrlSync = useRef(false);

  viewRef.current = view;

  useEffect(() => {
    const fromUrl =
      parsePublicMenuViewFromSearchParams(searchParams, supportsSubCategory) ??
      ({ type: "home" } as PublicMenuUrlViewBase);

    if (viewsEqual(fromUrl, viewRef.current)) return;

    skipViewToUrlSync.current = true;
    setView(fromUrl as T);
  }, [searchParams, supportsSubCategory]);

  useEffect(() => {
    if (skipViewToUrlSync.current) {
      skipViewToUrlSync.current = false;
      return;
    }

    const desired = buildSearchParamsForView(view, searchParams, supportsSubCategory);
    if (searchParamsEqual(desired, searchParams)) return;

    const query = desired.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [view, pathname, router, searchParams, supportsSubCategory]);

  const setViewStable = useCallback<React.Dispatch<React.SetStateAction<T>>>((value) => {
    skipViewToUrlSync.current = false;
    setView(value);
  }, []);

  return [view, setViewStable];
}
