import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { filterProductsByNavNode, findCategoryById } from "../types";

export const MODERN_BISTRO_CATEGORY_PRODUCT_PAGE_SIZE = 50;

export type ModernBistroView =
  | { type: "home" }
  | { type: "category"; categoryId: number; subCategoryId: number | null }
  | {
      type: "product";
      productId: number;
      categoryId: number | null;
      subCategoryId: number | null;
    };

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

export function findCategoryNode(
  categories: TaxonomyNavNode[],
  categoryId: number,
): TaxonomyNavNode | null {
  return findCategoryById(categories, categoryId);
}

export function listAvailableProducts(products: MenuProductApiItem[]): MenuProductApiItem[] {
  return products.filter((product) => product.available !== false);
}

export function resolveModernBistroFilterNode(
  category: TaxonomyNavNode,
  subCategoryId: number | null,
): TaxonomyNavNode {
  if (subCategoryId == null) return category;
  const sub = category.children.find((child) => child.categoryId === subCategoryId);
  return sub ?? category;
}

export function filterModernBistroCategoryProducts(
  products: MenuProductApiItem[],
  category: TaxonomyNavNode,
  subCategoryId: number | null,
): MenuProductApiItem[] {
  const node = resolveModernBistroFilterNode(category, subCategoryId);
  return listAvailableProducts(filterProductsForCategory(products, node)).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

export function countModernBistroCategoryProducts(
  products: MenuProductApiItem[],
  category: TaxonomyNavNode,
  subCategoryId: number | null,
): number {
  return filterModernBistroCategoryProducts(products, category, subCategoryId).length;
}

export function countModernBistroSubcategoryProducts(
  products: MenuProductApiItem[],
  subCategory: TaxonomyNavNode,
): number {
  return listAvailableProducts(filterProductsForCategory(products, subCategory)).length;
}
