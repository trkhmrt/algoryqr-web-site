"use client";

import { useEffect } from "react";

import type { NutritionFacts, MenuProductApiItem } from "@/lib/api";
import type { ChefProductItem } from "@/lib/chef/parse-chef-query";

import { useMenuProductNavigatorOptional } from "./menu-product-navigator";
import { useMenuExperienceOptional } from "./menu-experience";

export function chefItemToMenuProduct(item: ChefProductItem): MenuProductApiItem {
  return {
    productId: item.productId,
    menuId: item.menuId,
    name: item.name,
    description: item.description ?? undefined,
    price: item.price ?? undefined,
    currency: item.currency || "TRY",
    subCategoryId: item.subCategoryId ?? 0,
    subCategoryName: item.subCategoryName ?? undefined,
    mainCategoryName: item.mainCategoryName ?? undefined,
    sortOrder: 0,
    imageUrl: item.imageUrl ?? undefined,
    available: item.available,
    nutrition: (item.nutrition as NutritionFacts | null | undefined) ?? null,
  };
}

export function resolveSelectedProduct(
  products: MenuProductApiItem[],
  productId: number | null | undefined,
  pinned: MenuProductApiItem | null,
): MenuProductApiItem | null {
  if (productId == null) return null;
  return (
    products.find((p) => p.productId === productId) ??
    (pinned?.productId === productId ? pinned : null)
  );
}

export function useRegisterChefOpenProduct(
  openProduct: (product: MenuProductApiItem) => void,
) {
  const navigator = useMenuProductNavigatorOptional();
  const experience = useMenuExperienceOptional();

  useEffect(() => {
    if (!navigator) return;
    return navigator.registerOpenProduct((product) => {
      experience?.enterMenu();
      openProduct(product);
    });
  }, [experience, navigator, openProduct]);

  useEffect(() => {
    if (!experience?.pendingProduct) return;
    const product = experience.pendingProduct;
    experience.clearPendingProduct();
    openProduct(product);
  }, [experience, experience?.pendingProduct, openProduct]);
}
