import type { MenuCategoryApiItem, MenuProductApiItem } from "@/lib/api";

export type LumiereView =
  | { type: "home" }
  | { type: "category"; categoryId: number }
  | { type: "product"; productId: number; categoryId: number | null };

export type LumiereNavTab = "menu" | "search" | "specials" | "info";

export function collectCategoryIds(category: MenuCategoryApiItem): number[] {
  return [
    category.categoryId,
    ...(category.children ?? []).flatMap(collectCategoryIds),
  ];
}

export function findCategoryById(
  categories: MenuCategoryApiItem[],
  categoryId: number,
): MenuCategoryApiItem | null {
  for (const category of categories) {
    if (category.categoryId === categoryId) return category;
    const nested = findCategoryById(category.children ?? [], categoryId);
    if (nested) return nested;
  }
  return null;
}

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

export function firstRootCategory(
  categories: MenuCategoryApiItem[],
): MenuCategoryApiItem | null {
  return categories[0] ?? null;
}

export function countProductsForCategory(
  products: MenuProductApiItem[],
  category: MenuCategoryApiItem,
): number {
  return filterProductsForCategory(products, category).length;
}
