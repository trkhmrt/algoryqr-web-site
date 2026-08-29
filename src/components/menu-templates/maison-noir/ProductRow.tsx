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
            {unavailable ? (
              <p className="mt-2 text-[0.65rem] tracking-[0.2em] text-[var(--mn-muted)]/70">
                MEVCUT DEĞİL
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
