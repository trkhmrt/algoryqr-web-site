"use client";

import type { MenuProductApiItem } from "@/lib/api";

import { ModernBistroProductCard } from "./ProductCard";

type ModernBistroHomeProductListProps = {
  products: MenuProductApiItem[];
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function ModernBistroHomeProductList({
  products,
  onOpenProduct,
}: ModernBistroHomeProductListProps) {
  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4">
      {products.map((product) => (
        <ModernBistroProductCard
          key={product.productId}
          product={product}
          onOpen={onOpenProduct}
        />
      ))}
    </div>
  );
}
