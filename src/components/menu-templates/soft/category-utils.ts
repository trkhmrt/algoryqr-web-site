import type { MainCategoryApiItem, MenuProductApiItem, SubCategoryApiItem } from "@/lib/api";

export function filterProductsForSubCategory(
  products: MenuProductApiItem[],
  subCategoryId: number | null,
): MenuProductApiItem[] {
  if (subCategoryId == null) return products;
  return products.filter((product) => product.subCategoryId === subCategoryId);
}

export function filterProductsForMainCategory(
  products: MenuProductApiItem[],
  mainCategoryId: number | null,
): MenuProductApiItem[] {
  if (mainCategoryId == null) return products;
  return products.filter((product) => product.mainCategoryId === mainCategoryId);
}

export function resolveSubCategories(
  categories: MainCategoryApiItem[],
  activeCategoryId: "all" | number,
): SubCategoryApiItem[] {
  if (activeCategoryId === "all") {
    return categories.flatMap((c) => c.subs ?? []);
  }
  const active = categories.find((c) => c.id === activeCategoryId);
  return active?.subs ?? [];
}

export function filterVisibleProducts(
  products: MenuProductApiItem[],
  categories: MainCategoryApiItem[],
  activeCategoryId: "all" | number,
  activeSubCategoryId: "all" | number,
): MenuProductApiItem[] {
  if (activeSubCategoryId !== "all") {
    return filterProductsForSubCategory(products, activeSubCategoryId);
  }
  if (activeCategoryId !== "all") {
    return filterProductsForMainCategory(products, activeCategoryId);
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
