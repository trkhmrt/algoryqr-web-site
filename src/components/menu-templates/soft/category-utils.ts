import type { MenuCategoryApiItem, MenuProductApiItem } from "@/lib/api";
import { collectCategoryIds, findCategoryById } from "../types";

export function filterProductsForCategory(
  products: MenuProductApiItem[],
  category: MenuCategoryApiItem | null,
): MenuProductApiItem[] {
  if (!category) return products;
  const ids = new Set(collectCategoryIds(category));
  return products.filter(
    (product) => product.categoryId != null && ids.has(product.categoryId),
  );
}

export function resolveActiveCategory(
  categories: MenuCategoryApiItem[],
  activeCategoryId: "all" | number,
): MenuCategoryApiItem | null {
  if (activeCategoryId === "all") return null;
  return findCategoryById(categories, activeCategoryId);
}

export function resolveSubCategories(
  categories: MenuCategoryApiItem[],
  activeCategoryId: "all" | number,
): MenuCategoryApiItem[] {
  if (activeCategoryId === "all") {
    return categories.flatMap((c) => c.children ?? []);
  }
  const active = findCategoryById(categories, activeCategoryId);
  return active?.children ?? [];
}

export function filterVisibleProducts(
  products: MenuProductApiItem[],
  categories: MenuCategoryApiItem[],
  activeCategoryId: "all" | number,
  activeSubCategoryId: "all" | number,
): MenuProductApiItem[] {
  if (activeSubCategoryId !== "all") {
    const sub = findCategoryById(categories, activeSubCategoryId);
    return filterProductsForCategory(products, sub);
  }
  if (activeCategoryId !== "all") {
    const cat = findCategoryById(categories, activeCategoryId);
    return filterProductsForCategory(products, cat);
  }
  return products;
}

export function formatNutritionValue(
  value: number | string | null | undefined,
): string | null {
  if (value == null || value === "") return null;
  return String(value);
}

export function nutritionBarPercent(
  value: number | string | null | undefined,
  max: number,
): number {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (n == null || !Number.isFinite(n) || max <= 0) return 0;
  return Math.min(100, Math.round((n / max) * 100));
}
