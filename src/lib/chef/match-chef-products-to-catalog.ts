import type { MenuProductApiItem } from "@/lib/api";

import { mapMenuProductToChefItem } from "./map-menu-product-to-chef-item";
import type { ChefProductItem } from "./parse-chef-query";

export function foldChefProductName(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFC")
    .replace(/\s+/g, " ");
}

export function matchChefProductsToCatalog(
  catalog: MenuProductApiItem[],
  products: ChefProductItem[],
): ChefProductItem[] {
  const byId = new Map<number, MenuProductApiItem>();
  const byName = new Map<string, MenuProductApiItem>();
  for (const product of catalog) {
    if (!Number.isFinite(product.productId) || product.productId <= 0) continue;
    byId.set(product.productId, product);
    const key = foldChefProductName(product.name);
    if (key && !byName.has(key)) byName.set(key, product);
  }

  const resolved: ChefProductItem[] = [];
  const seen = new Set<number>();
  for (const item of products) {
    const match =
      byId.get(item.productId) ??
      (item.name ? byName.get(foldChefProductName(item.name)) : undefined);
    if (!match || match.available === false) continue;
    if (seen.has(match.productId)) continue;
    seen.add(match.productId);
    resolved.push(mapMenuProductToChefItem(match));
  }
  return resolved;
}
