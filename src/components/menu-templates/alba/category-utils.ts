import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { collectCategoryIds, filterProductsByNavNode } from "../types";
import { albaCategoryMark } from "./styles";

export type AlbaView =
  | { type: "home" }
  | { type: "category"; categoryId: number }
  | { type: "product"; productId: number; categoryId: number | null };

export function getBreadcrumbs(
  categories: TaxonomyNavNode[],
  categoryId: number,
): TaxonomyNavNode[] {
  const trail: TaxonomyNavNode[] = [];

  function walk(
    nodes: TaxonomyNavNode[],
    targetId: number,
    path: TaxonomyNavNode[],
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
  category: TaxonomyNavNode | null,
): MenuProductApiItem[] {
  return filterProductsByNavNode(products, category);
}

export function countProductsForCategory(
  products: MenuProductApiItem[],
  category: TaxonomyNavNode,
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

export function categoryMarkFor(
  category: TaxonomyNavNode,
  rootCategories: TaxonomyNavNode[],
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
  return albaCategoryMark(rootIndex >= 0 ? rootIndex : category.categoryId);
}

export function formatNutritionValue(
  value: number | string | null | undefined,
): string | null {
  if (value == null || value === "") return null;
  return String(value);
}
