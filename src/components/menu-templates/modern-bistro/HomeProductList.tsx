"use client";

import { Loader2, ShoppingCart } from "lucide-react";
import { useState } from "react";

import type { MenuProductApiItem } from "@/lib/api";

import { useOrderingOptional } from "../shared/ordering-context";
import { useMenuLocaleOptional } from "../shared/menu-locale";
import { useMenuPriceDisplay } from "../shared/menu-currency";

import { ModernBistroProductRow } from "./ProductRow";

type ModernBistroHomeProductListProps = {
  products: MenuProductApiItem[];
  onOpenProduct: (product: MenuProductApiItem) => void;
};

function FeaturedProductCard({
  product,
  onOpen,
}: {
  product: MenuProductApiItem;
  onOpen: (product: MenuProductApiItem) => void;
}) {
  const ordering = useOrderingOptional();
  const locale = useMenuLocaleOptional();
  const price = useMenuPriceDisplay(product.price, product.currency);
  const [busy, setBusy] = useState(false);
  const unavailable = product.available === false;
  const addLabel = locale?.t.addToOrder ?? "Sepete ekle";

  const handleAdd = async () => {
    if (!ordering || unavailable) return;
    setBusy(true);
    try {
      await ordering.addProduct(product, 1);
      ordering.setCartOpen(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--mb-border)] bg-[var(--mb-surface)] shadow-[0_8px_24px_rgba(17,17,17,0.04)]">
      <button type="button" onClick={() => onOpen(product)} className="block w-full text-left">
        {product.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="aspect-[16/10] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[16/10] w-full items-center justify-center bg-[#f3f4f6] text-4xl opacity-40">
            🍽️
          </div>
        )}
        <div className="space-y-2 px-4 py-4">
          <h3 className="text-lg font-semibold text-[var(--mb-fg)]">{product.name}</h3>
          {product.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-[var(--mb-muted)]">
              {product.description}
            </p>
          ) : null}
          {price ? <p className="text-base font-semibold text-[var(--mb-fg)]">{price}</p> : null}
        </div>
      </button>
      {ordering && !unavailable ? (
        <div className="px-4 pb-4">
          <button
            type="button"
            disabled={busy || ordering.loading}
            onClick={() => void handleAdd()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--mb-primary)] px-4 py-3 text-sm font-semibold text-[var(--mb-primary-fg)] transition hover:opacity-90 disabled:opacity-50"
          >
            {busy || ordering.loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
            {addLabel}
          </button>
        </div>
      ) : null}
    </article>
  );
}

export function ModernBistroHomeProductList({
  products,
  onOpenProduct,
}: ModernBistroHomeProductListProps) {
  if (products.length === 0) return null;

  const [featured, ...rest] = products;

  return (
    <div className="space-y-1">
      {featured ? <FeaturedProductCard product={featured} onOpen={onOpenProduct} /> : null}
      {rest.length > 0 ? (
        <ul className="divide-y divide-[var(--mb-border)]">
          {rest.map((product) => (
            <ModernBistroProductRow key={product.productId} product={product} onOpen={onOpenProduct} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
