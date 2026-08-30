import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { filterProductsByNavNode, findCategoryById } from "../types";

export const MAISON_CATEGORY_PRODUCT_PAGE_SIZE = 50;

export type MaisonNoirView =
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

export function resolveMaisonFilterNode(
  category: TaxonomyNavNode,
  subCategoryId: number | null,
): TaxonomyNavNode {
  if (subCategoryId == null) return category;
  const sub = category.children.find((child) => child.categoryId === subCategoryId);
  return sub ?? category;
}

export function filterMaisonCategoryProducts(
  products: MenuProductApiItem[],
  category: TaxonomyNavNode,
  subCategoryId: number | null,
): MenuProductApiItem[] {
  const node = resolveMaisonFilterNode(category, subCategoryId);
  return listAvailableProducts(filterProductsForCategory(products, node)).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

export function countMaisonCategoryProducts(
  products: MenuProductApiItem[],
  category: TaxonomyNavNode,
  subCategoryId: number | null,
): number {
  return filterMaisonCategoryProducts(products, category, subCategoryId).length;
}

export function countMaisonSubcategoryProducts(
  products: MenuProductApiItem[],
  subCategory: TaxonomyNavNode,
): number {
  return listAvailableProducts(filterProductsForCategory(products, subCategory)).length;
}

export function pickChefRecommendedProducts(
  products: MenuProductApiItem[],
): MenuProductApiItem[] {
  return products.filter((product) => product.chefRecommended && product.available !== false);
}

export function formatMaisonPrice(price?: number | string) {
  const amount = typeof price === "string" ? parseFloat(price) : price;
  if (amount == null || !Number.isFinite(amount)) return "";
  return amount.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
}
