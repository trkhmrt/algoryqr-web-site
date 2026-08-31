"use client";

import type { MenuProductApiItem } from "@/lib/api";

import { useOrderingOptional } from "../shared/ordering-context";
import { formatMaisonPrice } from "./category-utils";

type ProductRowProps = {
  product: MenuProductApiItem;
  onOpen: (product: MenuProductApiItem) => void;
};

export function MaisonNoirProductRow({ product, onOpen }: ProductRowProps) {
  const ordering = useOrderingOptional();
  const price = formatMaisonPrice(product.price);
  const unavailable = product.available === false;
  const chefPick = product.chefRecommended && !unavailable;

  return (
    <li>
      <div className="group flex items-start gap-4 py-4">
        <button
          type="button"
          onClick={() => onOpen(product)}
          className="flex min-w-0 flex-1 items-start gap-4 text-left transition-opacity hover:opacity-80"
        >
          <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-[var(--mn-surface)]">
            {product.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={product.imageUrl}
                alt={product.name}
                width={64}
                height={64}
                loading="lazy"
                className="h-16 w-16 object-cover grayscale-[35%] transition duration-700 group-hover:grayscale-0"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-base text-[var(--mn-primary)]/40">
                ◆
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {chefPick ? (
              <p className="mb-1 mn-type-eyebrow text-[var(--mn-primary)]">Şef önerisi</p>
            ) : null}
            <div className="flex items-start justify-between gap-3">
              <h3 className="mn-type-product text-[var(--mn-fg)]">{product.name}</h3>
              {price ? (
                <span className="mn-type-price shrink-0 text-[var(--mn-primary)]">{price}</span>
              ) : null}
            </div>
            {product.description ? (
              <p className="mt-1.5 line-clamp-2 mn-type-body text-[var(--mn-muted)]">
                {product.description}
              </p>
            ) : null}
            {unavailable ? (
              <p className="mt-1.5 mn-type-eyebrow text-[var(--mn-muted)]">Mevcut değil</p>
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
            className="mt-0.5 shrink-0 border border-[var(--mn-primary)]/40 px-2.5 py-1.5 mn-type-eyebrow text-[var(--mn-primary)] transition-colors hover:bg-[var(--mn-primary)] hover:text-[var(--mn-primary-fg)] disabled:opacity-50"
          >
            Ekle
          </button>
        ) : null}
      </div>
    </li>
  );
}
