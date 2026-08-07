import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";

export type GlassyView =
  | { type: "home" }
  | { type: "category"; categoryId: number }
  | { type: "product"; productId: number; categoryId: number | null };

export function firstRootCategory(
  categories: TaxonomyNavNode[],
): TaxonomyNavNode | null {
  return categories[0] ?? null;
}

export function popularProducts(products: MenuProductApiItem[], limit = 6) {
  const featured = products.filter((p) => p.available && p.imageUrl).slice(0, limit);
  return featured.length > 0 ? featured : products.slice(0, limit);
}

const CATEGORY_ICONS = [
  "restaurant_menu",
  "star",
  "eco",
  "grain",
  "auto_awesome",
  "local_bar",
  "cake",
  "coffee",
] as const;

export function categoryIcon(index: number) {
  return CATEGORY_ICONS[index % CATEGORY_ICONS.length];
}
