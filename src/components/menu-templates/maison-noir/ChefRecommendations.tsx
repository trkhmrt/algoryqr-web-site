"use client";

import type { MenuProductApiItem } from "@/lib/api";

import { formatMaisonPrice } from "./category-utils";

type ChefRecommendationsProps = {
  products: MenuProductApiItem[];
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function MaisonNoirChefRecommendations({
  products,
  onOpenProduct,
}: ChefRecommendationsProps) {
  if (products.length === 0) return null;

  return (
    <section>
      <h2 className="mn-type-eyebrow text-[var(--mn-primary)]">Şef Önerileri</h2>
      <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 scrollbar-none">
        {products.map((product) => (
          <ChefProductCard
            key={product.productId}
            product={product}
            onOpen={onOpenProduct}
          />
        ))}
      </div>
    </section>
  );
}

function ChefProductCard({
  product,
  onOpen,
}: {
  product: MenuProductApiItem;
  onOpen: (product: MenuProductApiItem) => void;
}) {
  const price = formatMaisonPrice(product.price);

  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      className="w-[8.75rem] shrink-0 snap-start border border-[var(--mn-border)] bg-[var(--mn-surface)]/60 text-left transition-colors hover:border-[var(--mn-primary)]/50"
    >
      <div className="h-24 w-full overflow-hidden bg-[var(--mn-bg)]">
        {product.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover grayscale-[30%] transition duration-700 hover:grayscale-0"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-lg text-[var(--mn-primary)]/30">
            ◆
          </div>
        )}
      </div>
      <div className="space-y-1 px-2.5 py-2">
        <h3 className="line-clamp-2 mn-type-product text-[0.875rem] text-[var(--mn-fg)]">
          {product.name}
        </h3>
        {price ? (
          <p className="mn-type-price text-[var(--mn-primary)]">{price}</p>
        ) : null}
      </div>
    </button>
  );
}
