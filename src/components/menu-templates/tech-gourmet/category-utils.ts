import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { filterProductsByNavNode, findCategoryById } from "../types";

export type TechGourmetView =
  | { type: "home" }
  | { type: "category"; categoryId: number }
  | { type: "product"; productId: number; categoryId: number | null };

export function getChildren(
  categories: TaxonomyNavNode[],
  parentId: number | null,
): TaxonomyNavNode[] {
  if (parentId == null) return categories;
  const parent = findCategoryById(categories, parentId);
  return parent?.children ?? [];
}

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
