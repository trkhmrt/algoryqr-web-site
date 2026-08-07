"use client";

import { useEffect, useState } from "react";

import {
  getPublicProductRecommendationsRequest,
  type MenuProductApiItem,
} from "@/lib/api";
import { SoftProductCard } from "./ProductCard";

type SoftProductRecommendationsProps = {
  menuId: number;
  productId: number;
  onOpenProduct?: (product: MenuProductApiItem) => void;
};

export function SoftProductRecommendations({
  menuId,
  productId,
  onOpenProduct,
}: SoftProductRecommendationsProps) {
  const [items, setItems] = useState<MenuProductApiItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getPublicProductRecommendationsRequest(menuId, productId, 4)
      .then((data) => {
        if (!cancelled) {
          setItems(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [menuId, productId]);

  if (!onOpenProduct || items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg font-semibold sf-fg">Benzer ürünler</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <SoftProductCard key={item.productId} item={item} onOpen={onOpenProduct} />
        ))}
      </div>
    </div>
  );
}
