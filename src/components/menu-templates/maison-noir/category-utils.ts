import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { filterProductsByNavNode, findCategoryById } from "../types";

export type MaisonNoirView =
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

export function findCategoryNode(
  categories: TaxonomyNavNode[],
  categoryId: number,
): TaxonomyNavNode | null {
  return findCategoryById(categories, categoryId);
}

export function pickChefRecommendedProducts(
  products: MenuProductApiItem[],
): MenuProductApiItem[] {
  return products.filter((p) => p.chefRecommended && p.available !== false);
}

export function formatMaisonPrice(price?: number | string) {
  const amount = typeof price === "string" ? parseFloat(price) : price;
  if (amount == null || !Number.isFinite(amount)) return "";
  return amount.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
}
