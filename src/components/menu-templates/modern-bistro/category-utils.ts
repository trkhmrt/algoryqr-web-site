import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { filterProductsByNavNode, findCategoryById } from "../types";

export type ModernBistroView =
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

export function pickFeaturedProducts(products: MenuProductApiItem[]): MenuProductApiItem[] {
  const recommended = products.filter((p) => p.chefRecommended && p.available !== false);
  if (recommended.length > 0) {
    return recommended.slice(0, 4);
  }
  return products.filter((p) => p.available !== false).slice(0, 2);
}

export function findCategoryNode(
  categories: TaxonomyNavNode[],
  categoryId: number,
): TaxonomyNavNode | null {
  return findCategoryById(categories, categoryId);
}
