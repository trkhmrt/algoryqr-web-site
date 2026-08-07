import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { filterProductsByNavNode } from "../types";

export type LumiereView =
  | { type: "home" }
  | { type: "category"; categoryId: number }
  | { type: "product"; productId: number; categoryId: number | null };

export function countProductsForCategory(
  products: MenuProductApiItem[],
  category: TaxonomyNavNode,
): number {
  return filterProductsByNavNode(products, category).length;
}
