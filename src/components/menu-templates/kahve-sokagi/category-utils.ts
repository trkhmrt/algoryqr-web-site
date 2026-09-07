import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { filterProductsByNavNode } from "../types";

export const KAHVE_ALL_TAB = "all" as const;
export const KAHVE_FEATURED_TAB = "featured" as const;

export type KahveHomeTab =
  | { type: typeof KAHVE_ALL_TAB }
  | { type: typeof KAHVE_FEATURED_TAB }
  | { type: "category"; categoryId: number };

export function listAvailableProducts(products: MenuProductApiItem[]): MenuProductApiItem[] {
  return products.filter((product) => product.available !== false);
}

function parseRatingCount(product: MenuProductApiItem): number {
  const raw = product.ratingCount;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return 0;
}

export function kahveFeaturedProducts(products: MenuProductApiItem[]): MenuProductApiItem[] {
  const available = listAvailableProducts(products);
  const chefPicks = available.filter((product) => product.chefRecommended);
  if (chefPicks.length > 0) {
    return [...chefPicks].sort((left, right) => left.sortOrder - right.sortOrder);
  }

  const rated = available
    .filter((product) => parseRatingCount(product) > 0)
    .sort((left, right) => parseRatingCount(right) - parseRatingCount(left));
  if (rated.length > 0) return rated.slice(0, 8);

  return available.slice(0, 8);
}

export function kahveHomeSections(
  products: MenuProductApiItem[],
  categories: TaxonomyNavNode[],
  tab: KahveHomeTab,
): { key: string; title: string | null; category: TaxonomyNavNode | null; products: MenuProductApiItem[] }[] {
  const mains = categories.filter((category) => category.kind === "main");

  if (tab.type === KAHVE_FEATURED_TAB) {
    const featured = kahveFeaturedProducts(products);
    if (featured.length === 0) return [];
    return [{ key: KAHVE_FEATURED_TAB, title: null, category: null, products: featured }];
  }

  const targetMains =
    tab.type === "category"
      ? mains.filter((category) => category.categoryId === tab.categoryId)
      : mains;

  return targetMains
    .map((category) => ({
      key: String(category.categoryId),
      title: category.name,
      category,
      products: listAvailableProducts(filterProductsByNavNode(products, category)).sort(
        (left, right) => left.sortOrder - right.sortOrder,
      ),
    }))
    .filter((section) => section.products.length > 0);
}

export function kahveSearchProducts(
  products: MenuProductApiItem[],
  query: string,
): MenuProductApiItem[] {
  const q = query.trim().toLocaleLowerCase("tr");
  if (!q) return listAvailableProducts(products);
  return listAvailableProducts(products).filter((product) => {
    const name = product.name?.toLocaleLowerCase("tr") ?? "";
    const description = product.description?.toLocaleLowerCase("tr") ?? "";
    const tags = (product.tags ?? []).map((tag) => tag.name.toLocaleLowerCase("tr")).join(" ");
    return name.includes(q) || description.includes(q) || tags.includes(q);
  });
}

export function kahveQuickTags(products: MenuProductApiItem[], limit = 6): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const product of listAvailableProducts(products)) {
    for (const tag of product.tags ?? []) {
      const name = tag.name.trim();
      if (!name) continue;
      const key = name.toLocaleLowerCase("tr");
      if (seen.has(key)) continue;
      seen.add(key);
      tags.push(name);
      if (tags.length >= limit) return tags;
    }
  }
  return tags;
}
