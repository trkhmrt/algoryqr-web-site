import type { MenuProductApiItem } from "@/lib/api";

import type { ChefProductItem } from "./parse-chef-query";

function asNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function mapMenuProductToChefItem(product: MenuProductApiItem): ChefProductItem {
  return {
    productId: product.productId,
    menuId: product.menuId,
    name: product.name,
    description: product.description ?? null,
    subCategoryId: product.subCategoryId ?? null,
    subCategoryName: product.subCategoryName ?? null,
    mainCategoryName: product.mainCategoryName ?? null,
    price: asNumber(product.price),
    currency: product.currency || "TRY",
    imageUrl: product.imageUrl ?? null,
    available: product.available !== false,
    nutrition: (product.nutrition as Record<string, unknown> | null | undefined) ?? null,
  };
}
