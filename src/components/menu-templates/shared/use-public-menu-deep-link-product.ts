"use client";

import { useEffect, useState } from "react";

import { getPublicProductRequest, type MenuProductApiItem } from "@/lib/api";

import { resolveSelectedProduct } from "./use-chef-open-product";
import type { PublicMenuUrlViewBase } from "./use-public-menu-url-state";

type UsePublicMenuDeepLinkProductArgs = {
  menuId: number;
  view: PublicMenuUrlViewBase;
  products: MenuProductApiItem[];
  pinnedProduct: MenuProductApiItem | null;
  setPinnedProduct: (product: MenuProductApiItem | null) => void;
};

export function usePublicMenuDeepLinkProduct({
  menuId,
  view,
  products,
  pinnedProduct,
  setPinnedProduct,
}: UsePublicMenuDeepLinkProductArgs) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (view.type !== "product") return;

    const resolved = resolveSelectedProduct(products, view.productId, pinnedProduct);
    if (resolved) return;

    let cancelled = false;
    setLoading(true);

    getPublicProductRequest(menuId, view.productId)
      .then((product) => {
        if (cancelled) return;
        setPinnedProduct(product);
      })
      .catch(() => {
        if (cancelled) return;
        setPinnedProduct(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [menuId, pinnedProduct, products, setPinnedProduct, view]);

  return { loadingDeepLinkProduct: loading };
}
