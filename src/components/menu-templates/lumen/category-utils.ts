import type { MenuCategoryApiItem, MenuProductApiItem } from "@/lib/api";
import { collectCategoryIds, findCategoryById } from "../types";
import { lumenCategoryEmoji } from "./styles";

export type LumenView =
  | { type: "home" }
  | { type: "category"; categoryId: number }
  | { type: "product"; productId: number; categoryId: number | null };

export function getChildren(
  categories: MenuCategoryApiItem[],
  parentId: number | null,
): MenuCategoryApiItem[] {
  if (parentId == null) return categories;
  const parent = findCategoryById(categories, parentId);
  return parent?.children ?? [];
}

export function getBreadcrumbs(
  categories: MenuCategoryApiItem[],
  categoryId: number,
): MenuCategoryApiItem[] {
  const trail: MenuCategoryApiItem[] = [];

  function walk(
    nodes: MenuCategoryApiItem[],
    targetId: number,
    path: MenuCategoryApiItem[],
  ): boolean {
    for (const node of nodes) {
      const next = [...path, node];
      if (node.categoryId === targetId) {
        trail.push(...next);
        return true;
      }
      if (walk(node.children ?? [], targetId, next)) return true;
    }
    return false;
  }

  walk(categories, categoryId, []);
  return trail;
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

export function countProductsForCategory(
  products: MenuProductApiItem[],
  category: MenuCategoryApiItem,
): number {
  return filterProductsForCategory(products, category).length;
}

export function popularProducts(products: MenuProductApiItem[], limit = 6) {
  const withImage = products
    .filter((p) => Boolean(p.imageUrl) && p.available !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (withImage.length > 0) return withImage.slice(0, limit);
  return [...products].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, limit);
}

export function categoryEmojiFor(
  category: MenuCategoryApiItem,
  rootCategories: MenuCategoryApiItem[],
) {
  const index = Math.max(
    0,
    rootCategories.findIndex((c) => c.categoryId === category.categoryId),
  );
  const rootIndex =
    index >= 0
      ? index
      : rootCategories.findIndex((root) =>
          collectCategoryIds(root).includes(category.categoryId),
        );
  return lumenCategoryEmoji(rootIndex >= 0 ? rootIndex : category.categoryId);
}

export function formatNutritionValue(
  value: number | string | null | undefined,
): string | null {
  if (value == null || value === "") return null;
  return String(value);
}
