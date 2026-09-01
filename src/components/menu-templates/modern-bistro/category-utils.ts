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

export const MODERN_BISTRO_POPULAR_TAB = "popular" as const;

export type ModernBistroHomeTab =
  | { type: typeof MODERN_BISTRO_POPULAR_TAB }
  | { type: "category"; categoryId: number };

function parseRatingCount(product: MenuProductApiItem): number {
  const raw = product.ratingCount;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return 0;
}

export function modernBistroPopularProducts(products: MenuProductApiItem[]): MenuProductApiItem[] {
  const available = listAvailableProducts(products);
  const chefPicks = available.filter((product) => product.chefRecommended);
  if (chefPicks.length > 0) {
    return [...chefPicks].sort((left, right) => left.sortOrder - right.sortOrder);
  }

  const rated = available
    .filter((product) => parseRatingCount(product) > 0)
    .sort((left, right) => parseRatingCount(right) - parseRatingCount(left));
  if (rated.length > 0) return rated;

  const withImage = available.filter((product) => product.imageUrl);
  if (withImage.length > 0) return withImage;

  return available;
}

export function modernBistroHomeProducts(
  products: MenuProductApiItem[],
  categories: TaxonomyNavNode[],
  tab: ModernBistroHomeTab,
): MenuProductApiItem[] {
  if (tab.type === MODERN_BISTRO_POPULAR_TAB) {
    return modernBistroPopularProducts(products);
  }
  const category = findCategoryById(categories, tab.categoryId);
  if (!category) return [];
  return filterModernBistroCategoryProducts(products, category, null);
}
