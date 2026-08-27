import { fetchPublicMenuCatalog } from "./fetch-public-menu-products";
import { matchChefProductsToCatalog } from "./match-chef-products-to-catalog";
import type { ChefProductItem } from "./parse-chef-query";

export async function reconcileChefProductsWithMenuCatalog(
  menuId: number,
  products: ChefProductItem[],
): Promise<ChefProductItem[]> {
  if (products.length === 0) return [];
  const catalog = await fetchPublicMenuCatalog(menuId);
  return matchChefProductsToCatalog(catalog, products);
}
