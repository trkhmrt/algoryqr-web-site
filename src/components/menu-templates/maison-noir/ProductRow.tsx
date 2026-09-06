"use client";

import type { MenuProductApiItem } from "@/lib/api";

import { useOrderingOptional } from "../shared/ordering-context";
import { useMenuPriceDisplay } from "../shared/menu-currency";
import { useMenuLocale } from "../shared/menu-locale";

type ProductRowProps = {
  product: MenuProductApiItem;
  onOpen: (product: MenuProductApiItem) => void;
};

export function MaisonNoirProductRow({ product, onOpen }: ProductRowProps) {
  const ordering = useOrderingOptional();
  const { t } = useMenuLocale();
  const price = useMenuPriceDisplay(product.price, product.currency);
  const unavailable = product.available === false;
  const chefPick = product.chefRecommended && !unavailable;
  const showAdd = Boolean(ordering && !unavailable);

  return (
    <li>
      <div className="group grid grid-cols-[4rem_minmax(0,1fr)_auto] items-start gap-x-3 py-4">
        <button
          type="button"
          onClick={() => onOpen(product)}
          className="relative h-16 w-16 shrink-0 overflow-hidden bg-[var(--mn-surface)] transition-opacity hover:opacity-80"
        >
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
        </button>

        <button
          type="button"
          onClick={() => onOpen(product)}
          className="min-w-0 text-left transition-opacity hover:opacity-80"
        >
          {chefPick ? (
            <p className="mb-1 mn-type-eyebrow text-[var(--mn-primary)]">{t.chefRecommended}</p>
          ) : null}
          <h3 className="mn-type-product text-[var(--mn-fg)]">{product.name}</h3>
          {product.description ? (
            <p className="mt-1.5 line-clamp-2 mn-type-body text-[var(--mn-muted)]">
              {product.description}
            </p>
          ) : null}
          {unavailable ? (
            <p className="mt-1.5 mn-type-eyebrow text-[var(--mn-muted)]">
              {t.productUnavailable}
            </p>
          ) : null}
        </button>

        <div className="flex min-w-[3.5rem] flex-col items-end gap-2 self-stretch pt-0.5">
          {price ? (
            <span className="mn-type-price whitespace-nowrap text-[var(--mn-primary)]">
              {price}
            </span>
          ) : null}
          {showAdd && ordering ? (
            <button
              type="button"
              onClick={async () => {
                await ordering.beginAddProduct(product, 1);
              }}
              disabled={ordering.loading}
              className="inline-flex min-h-8 min-w-[3.5rem] items-center justify-center border border-[var(--mn-primary)]/50 px-2.5 mn-type-eyebrow text-[var(--mn-primary)] transition-colors hover:bg-[var(--mn-primary)] hover:text-[var(--mn-primary-fg)] disabled:opacity-50"
            >
              {t.addToCart}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
