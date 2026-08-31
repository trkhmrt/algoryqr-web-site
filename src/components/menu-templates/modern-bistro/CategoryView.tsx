"use client";

import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { useState } from "react";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { useMenuPriceDisplay } from "../shared/menu-currency";
import { MenuProductScrollSentinel } from "../shared/MenuProductScrollSentinel";
import { useOrderingOptional } from "../shared/ordering-context";
import { filterProductsForCategory } from "./category-utils";

type CategoryViewProps = {
  category: TaxonomyNavNode;
  products: MenuProductApiItem[];
  onHome: () => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function ModernBistroCategoryView({
  category,
  products,
  onHome,
  onOpenProduct,
}: CategoryViewProps) {
  const categoryProducts = filterProductsForCategory(products, category);
  const compact = categoryProducts.length >= 4;

  return (
    <div>
      <div className="border-b border-[var(--mb-border)] bg-[var(--mb-surface)] px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={onHome}
            className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--mb-muted)] transition-colors hover:text-[var(--mb-fg)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Menüye dön
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--mb-fg)]">{category.name}</h1>
          <p className="mt-1 text-sm text-[var(--mb-muted)]">{categoryProducts.length} ürün</p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        {categoryProducts.length === 0 ? (
          <div className="py-20 text-center text-sm text-[var(--mb-muted)]">
            Bu kategoride ürün bulunmuyor.
          </div>
        ) : compact ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categoryProducts.map((product) => (
              <CompactProductCard key={product.productId} product={product} onOpen={onOpenProduct} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {categoryProducts.map((product) => (
              <FeaturedProductCard key={product.productId} product={product} onOpen={onOpenProduct} />
            ))}
          </div>
        )}
        <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-6" />
      </main>
    </div>
  );
}

function FeaturedProductCard({
  product,
  onOpen,
}: {
  product: MenuProductApiItem;
  onOpen: (product: MenuProductApiItem) => void;
}) {
  const price = useMenuPriceDisplay(product.price, product.currency);
  const unavailable = product.available === false;

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--mb-border)] bg-[var(--mb-surface)] shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
      <button type="button" onClick={() => onOpen(product)} className="block w-full text-left">
        <div className="aspect-[4/3] overflow-hidden bg-[#f3f4f6]">
          {product.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl opacity-30">🍽️</div>
          )}
        </div>
        <div className="space-y-1.5 p-4">
          <h3 className="text-base font-semibold text-[var(--mb-fg)]">{product.name}</h3>
          {product.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-[var(--mb-muted)]">
              {product.description}
            </p>
          ) : null}
          {price ? <p className="text-sm font-semibold text-[var(--mb-fg)]">{price}</p> : null}
        </div>
      </button>
      {!unavailable ? (
        <div className="flex justify-end px-4 pb-4">
          <AddButton product={product} />
        </div>
      ) : null}
    </article>
  );
}

function CompactProductCard({
  product,
  onOpen,
}: {
  product: MenuProductApiItem;
  onOpen: (product: MenuProductApiItem) => void;
}) {
  const price = useMenuPriceDisplay(product.price, product.currency);
  const unavailable = product.available === false;

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--mb-border)] bg-[var(--mb-surface)]">
      <button type="button" onClick={() => onOpen(product)} className="block w-full text-left">
        <div className="aspect-square overflow-hidden bg-[#f3f4f6]">
          {product.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl opacity-30">🍽️</div>
          )}
        </div>
        <div className="space-y-1 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--mb-fg)]">
            {product.name}
          </h3>
          {price ? <p className="text-sm font-medium text-[var(--mb-accent)]">{price}</p> : null}
        </div>
      </button>
      {!unavailable ? (
        <div className="flex justify-end px-3 pb-3">
          <AddButton product={product} small />
        </div>
      ) : null}
    </article>
  );
}

function AddButton({
  product,
  small,
}: {
  product: MenuProductApiItem;
  small?: boolean;
}) {
  const ordering = useOrderingOptional();
  const [busy, setBusy] = useState(false);

  if (!ordering) return null;

  return (
    <button
      type="button"
      disabled={busy || ordering.loading}
      onClick={async (event) => {
        event.stopPropagation();
        setBusy(true);
        try {
          await ordering.addProduct(product, 1);
        } finally {
          setBusy(false);
        }
      }}
      className={`inline-flex items-center justify-center rounded-full bg-[var(--mb-primary)] text-[var(--mb-primary-fg)] transition-opacity disabled:opacity-50 ${
        small ? "h-8 w-8" : "h-9 w-9"
      }`}
      aria-label="Sepete ekle"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
    </button>
  );
}
