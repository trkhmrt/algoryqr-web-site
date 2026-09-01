"use client";

import type { MenuProductApiItem } from "@/lib/api";

import { useOrderingOptional } from "../shared/ordering-context";
import { useMenuPriceDisplay } from "../shared/menu-currency";

type ProductRowProps = {
  product: MenuProductApiItem;
  onOpen: (product: MenuProductApiItem) => void;
};

export function ModernBistroProductRow({ product, onOpen }: ProductRowProps) {
  const ordering = useOrderingOptional();
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
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f3f4f6] transition-opacity hover:opacity-80"
        >
          {product.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={product.imageUrl}
              alt={product.name}
              width={64}
              height={64}
              loading="lazy"
              className="h-16 w-16 object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xl opacity-30">🍽️</div>
          )}
        </button>

        <button
          type="button"
          onClick={() => onOpen(product)}
          className="min-w-0 text-left transition-opacity hover:opacity-80"
        >
          {chefPick ? (
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--mb-accent)]">
              Şef önerisi
            </p>
          ) : null}
          <h3 className="text-base font-semibold text-[var(--mb-fg)]">{product.name}</h3>
          {product.description ? (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--mb-muted)]">
              {product.description}
            </p>
          ) : null}
          {unavailable ? (
            <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-[var(--mb-muted)]">
              Mevcut değil
            </p>
          ) : null}
        </button>

        <div className="flex min-w-[3.5rem] flex-col items-end gap-2 self-stretch pt-0.5">
          {price ? (
            <span className="whitespace-nowrap text-sm font-semibold text-[var(--mb-fg)]">
              {price}
            </span>
          ) : null}
          {showAdd && ordering ? (
            <button
              type="button"
              onClick={async () => {
                await ordering.addProduct(product, 1);
              }}
              disabled={ordering.loading}
              className="inline-flex min-h-8 min-w-[3.5rem] items-center justify-center rounded-full bg-[var(--mb-primary)] px-2.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--mb-primary-fg)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Ekle
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
