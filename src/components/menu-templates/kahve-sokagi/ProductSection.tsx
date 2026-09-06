"use client";

import type { MenuProductApiItem } from "@/lib/api";

import { KahveProductCard } from "./ProductCard";

type KahveProductSectionProps = {
  products: MenuProductApiItem[];
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function KahveProductSection({ products, onOpenProduct }: KahveProductSectionProps) {
  if (products.length === 0) return null;

  const firstPair = products.slice(0, 2);
  const restWide = products.slice(2);

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {firstPair.length === 1 ? (
        <KahveProductCard
          key={firstPair[0].productId}
          product={firstPair[0]}
          onOpen={onOpenProduct}
          layout="wide"
          className="col-span-2"
        />
      ) : (
        firstPair.map((product) => (
          <KahveProductCard
            key={product.productId}
            product={product}
            onOpen={onOpenProduct}
            layout="grid"
          />
        ))
      )}

      {restWide.map((product) => (
        <KahveProductCard
          key={product.productId}
          product={product}
          onOpen={onOpenProduct}
          layout="wide"
          className="col-span-2"
        />
      ))}
    </div>
  );
}
