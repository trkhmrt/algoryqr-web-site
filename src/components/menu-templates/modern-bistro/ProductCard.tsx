"use client";

import { Loader2, Plus, UtensilsCrossed } from "lucide-react";
import { useState, type MouseEvent } from "react";

import type { MenuProductApiItem } from "@/lib/api";

import { useMenuLocaleOptional } from "../shared/menu-locale";
import { useOrderingOptional } from "../shared/ordering-context";
import { useMenuPriceDisplay } from "../shared/menu-currency";

type ModernBistroProductCardProps = {
  product: MenuProductApiItem;
  onOpen: (product: MenuProductApiItem) => void;
};

export function ModernBistroProductCard({ product, onOpen }: ModernBistroProductCardProps) {
  const ordering = useOrderingOptional();
  const locale = useMenuLocaleOptional();
  const price = useMenuPriceDisplay(product.price, product.currency);
  const [busy, setBusy] = useState(false);
  const unavailable = product.available === false;
  const chefPick = product.chefRecommended && !unavailable;
  const showAdd = Boolean(ordering && !unavailable);

  const handleAdd = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
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
    <article className="flex items-stretch overflow-hidden rounded-2xl border border-[var(--mb-border)] bg-[var(--mb-surface)] shadow-[var(--mb-card-shadow)]">
      <button
        type="button"
        onClick={() => onOpen(product)}
        className="w-[7.5rem] shrink-0 self-stretch overflow-hidden bg-[var(--mb-muted-surface)] sm:w-32"
      >
        {product.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[var(--mb-muted)]">
            <UtensilsCrossed className="h-8 w-8 opacity-35" strokeWidth={1.5} />
          </span>
        )}
      </button>

      <div className="flex min-w-0 flex-1 items-stretch">
        <button
          type="button"
          onClick={() => onOpen(product)}
          className="flex min-w-0 flex-1 flex-col justify-center px-3 py-3 text-left sm:px-4"
        >
          {chefPick ? (
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--mb-accent)]">
              {locale?.t.chefRecommended ?? "Şef önerisi"}
            </p>
          ) : null}
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-[var(--mb-fg)]">
            {product.name}
          </h3>
          {product.description ? (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--mb-muted)]">
              {product.description}
            </p>
          ) : null}
          {price ? (
            <p className="mt-1.5 text-lg font-bold leading-none text-[var(--mb-fg)]">{price}</p>
          ) : null}
          {unavailable ? (
            <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-[var(--mb-muted)]">
              Mevcut değil
            </p>
          ) : null}
        </button>

        {showAdd ? (
          <div className="flex shrink-0 items-end p-3 sm:p-4">
            <button
              type="button"
              disabled={busy || ordering!.loading}
              onClick={(event) => void handleAdd(event)}
              aria-label={locale?.t.addToCart ?? "Sepete Ekle"}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--mb-cta)] text-[var(--mb-primary-fg)] shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50 sm:h-12 sm:w-12"
            >
              {busy || ordering!.loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
              )}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
