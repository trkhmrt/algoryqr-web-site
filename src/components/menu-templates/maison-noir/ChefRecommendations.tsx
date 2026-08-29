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
      <h2 className="mn-tracked text-[0.58rem] text-[var(--mn-primary)]">Şef Önerileri</h2>
      <div className="-mx-8 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-8 pb-1 scrollbar-none">
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
      className="w-44 shrink-0 snap-start border border-[var(--mn-border)] bg-[var(--mn-surface)]/60 text-left transition-colors hover:border-[var(--mn-primary)]/50"
    >
      <div className="h-32 w-full overflow-hidden bg-[var(--mn-bg)]">
        {product.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover grayscale-[30%] transition duration-700 hover:grayscale-0"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-2xl text-[var(--mn-primary)]/30">
            ◆
          </div>
        )}
      </div>
      <div className="space-y-1.5 px-3 py-3">
        <h3 className="line-clamp-2 font-display text-xl leading-tight text-[var(--mn-fg)]">
          {product.name}
        </h3>
        {price ? (
          <p className="font-display text-base text-[var(--mn-primary)]">{price}</p>
        ) : null}
      </div>
    </button>
  );
}
