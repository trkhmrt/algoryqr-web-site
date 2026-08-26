"use client";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { MenuProductScrollSentinel } from "../shared/MenuProductScrollSentinel";
import { useOrderingOptional } from "../shared/ordering-context";
import { filterProductsForCategory, formatMaisonPrice } from "./category-utils";

type CategoryViewProps = {
  category: TaxonomyNavNode;
  products: MenuProductApiItem[];
  onHome: () => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function MaisonNoirCategoryView({
  category,
  products,
  onHome,
  onOpenProduct,
}: CategoryViewProps) {
  const categoryProducts = filterProductsForCategory(products, category).filter(
    (p) => p.available !== false,
  );

  return (
    <main className="mx-auto min-h-[60vh] max-w-xl px-8 pb-8 pt-10">
      <header className="text-center">
        <button
          type="button"
          onClick={onHome}
          className="mn-tracked text-[0.58rem] text-[var(--mn-muted)] transition-colors hover:text-[var(--mn-primary)]"
        >
          ← Menü
        </button>
        <h1 className="mt-6 font-display text-5xl tracking-tight text-[var(--mn-fg)]">
          {category.name}
        </h1>
        <div className="mn-hairline mx-auto mt-6 w-24" />
        <p className="mt-4 mn-tracked text-[0.55rem] text-[var(--mn-muted)]">
          {categoryProducts.length} ürün
        </p>
      </header>

      {categoryProducts.length === 0 ? (
        <p className="mt-16 py-10 text-center text-sm text-[var(--mn-muted)]">
          Bu kategoride ürün bulunmuyor.
        </p>
      ) : (
        <ul className="mt-16 divide-y divide-[var(--mn-border)]">
          {categoryProducts.map((product) => (
            <ProductRow
              key={product.productId}
              product={product}
              onOpen={onOpenProduct}
            />
          ))}
        </ul>
      )}

      <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-6" />
    </main>
  );
}

function ProductRow({
  product,
  onOpen,
}: {
  product: MenuProductApiItem;
  onOpen: (product: MenuProductApiItem) => void;
}) {
  const ordering = useOrderingOptional();
  const price = formatMaisonPrice(product.price);
  const unavailable = product.available === false;

  return (
    <li>
      <div className="group flex items-start gap-5 py-6">
        <button
          type="button"
          onClick={() => onOpen(product)}
          className="flex min-w-0 flex-1 items-start gap-5 text-left transition-opacity hover:opacity-80"
        >
          <div className="h-20 w-20 shrink-0 overflow-hidden bg-[var(--mn-surface)]">
            {product.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={product.imageUrl}
                alt={product.name}
                width={80}
                height={80}
                loading="lazy"
                className="h-20 w-20 object-cover grayscale-[35%] transition duration-700 group-hover:grayscale-0"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-xl text-[var(--mn-primary)]/40">
                ◆
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-2xl leading-none text-[var(--mn-fg)]">
                {product.name}
              </h3>
              {price ? (
                <span className="font-display text-lg text-[var(--mn-primary)]">{price}</span>
              ) : null}
            </div>
            {product.description ? (
              <p className="mt-3 text-[0.8rem] leading-relaxed text-[var(--mn-muted)]">
                {product.description}
              </p>
            ) : null}
          </div>
        </button>
        {ordering && !unavailable ? (
          <button
            type="button"
            onClick={async () => {
              await ordering.addProduct(product, 1);
            }}
            disabled={ordering.loading}
            className="mt-1 shrink-0 border border-[var(--mn-primary)]/40 px-3 py-2 mn-tracked text-[0.5rem] text-[var(--mn-primary)] transition-colors hover:bg-[var(--mn-primary)] hover:text-[var(--mn-primary-fg)] disabled:opacity-50"
          >
            Ekle
          </button>
        ) : null}
      </div>
    </li>
  );
}
