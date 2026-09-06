"use client";

import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { useState } from "react";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { useMenuPriceDisplay } from "../shared/menu-currency";
import { MenuProductScrollSentinel } from "../shared/MenuProductScrollSentinel";
import { MenuCategoryName } from "../shared/MenuCategoryName";
import { useOrderingOptional } from "../shared/ordering-context";
import { filterProductsForCategory } from "./category-utils";

type CategoryViewProps = {
  category: TaxonomyNavNode;
  products: MenuProductApiItem[];
  onHome: () => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function CleverDishScribeCategoryView({
  category,
  products,
  onHome,
  onOpenProduct,
}: CategoryViewProps) {
  const categoryProducts = filterProductsForCategory(products, category);
  const compact = categoryProducts.length >= 4;

  return (
    <div>
      <div className="border-b border-[var(--cds-border)] bg-[var(--cds-bg)] px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={onHome}
            className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--cds-muted)] transition-colors hover:text-[var(--cds-fg)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Menüye dön
          </button>
          <h1 className="cds-enter text-2xl font-bold tracking-tight text-[var(--cds-fg)]">
            <MenuCategoryName name={category.name} />
          </h1>
          <p className="mt-1 text-sm text-[var(--cds-muted)]">{categoryProducts.length} ürün</p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        {categoryProducts.length === 0 ? (
          <div className="py-20 text-center text-sm text-[var(--cds-muted)]">
            Bu kategoride ürün bulunmuyor.
          </div>
        ) : compact ? (
          <div className="cds-hscroll scrollbar-none -mx-1 px-1">
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
    <article className="cds-card overflow-hidden rounded-2xl border border-[var(--cds-border)] bg-[var(--cds-surface)]">
      <button type="button" onClick={() => onOpen(product)} className="block w-full text-left">
        <div className="aspect-[4/3] overflow-hidden bg-[#1f1f1f]">
          {product.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl opacity-30">🍽️</div>
          )}
        </div>
        <div className="space-y-1.5 p-4">
          <h3 className="text-base font-semibold text-[var(--cds-fg)]">{product.name}</h3>
          {product.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-[var(--cds-muted)]">
              {product.description}
            </p>
          ) : null}
          <div className="flex items-center justify-between pt-1">
            {price ? <p className="text-sm font-semibold text-[var(--cds-accent)]">{price}</p> : <span />}
            {!unavailable ? <AddButton product={product} /> : null}
          </div>
        </div>
      </button>
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
    <article className="cds-card w-[9.5rem] overflow-hidden rounded-2xl border border-[var(--cds-border)] bg-[var(--cds-surface)] sm:w-[10.5rem]">
      <button type="button" onClick={() => onOpen(product)} className="block w-full text-left">
        <div className="aspect-square overflow-hidden bg-[#1f1f1f]">
          {product.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl opacity-30">🍽️</div>
          )}
        </div>
        <div className="space-y-1 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--cds-fg)]">
            {product.name}
          </h3>
          <div className="flex items-center justify-between gap-2">
            {price ? <p className="text-sm font-medium text-[var(--cds-accent)]">{price}</p> : <span />}
            {!unavailable ? <AddButton product={product} small /> : null}
          </div>
        </div>
      </button>
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
          await ordering.beginAddProduct(product, 1);
        } finally {
          setBusy(false);
        }
      }}
      className={`cds-add-tap inline-flex items-center justify-center rounded-full text-[var(--cds-muted)] transition-colors hover:text-[var(--cds-fg)] disabled:opacity-50 ${
        small ? "h-7 w-7" : "h-8 w-8"
      }`}
      aria-label="Sepete ekle"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 stroke-[1.75]" />}
    </button>
  );
}
