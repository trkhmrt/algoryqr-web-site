"use client";

import { Loader2, ShoppingCart, Star } from "lucide-react";
import { useState } from "react";

import type { MenuProductApiItem } from "@/lib/api";

import { useMenuPriceDisplay } from "../shared/menu-currency";
import { useMenuLocale } from "../shared/menu-locale";
import { useOrderingOptional } from "../shared/ordering-context";

type KahveFeaturedCardProps = {
  product: MenuProductApiItem;
  onOpen: (product: MenuProductApiItem) => void;
};

export function KahveFeaturedCard({ product, onOpen }: KahveFeaturedCardProps) {
  const { t } = useMenuLocale();
  const ordering = useOrderingOptional();
  const price = useMenuPriceDisplay(product.price, product.currency);
  const [busy, setBusy] = useState(false);
  const unavailable = product.available === false;
  const showAdd = Boolean(ordering && !unavailable);

  const handleAdd = async () => {
    if (!ordering || unavailable) return;
    setBusy(true);
    try {
      await ordering.beginAddProduct(product, 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--ks-secondary)_30%,transparent)] bg-gradient-to-br from-[#381c0c] via-[#4a2612] to-[#241006] p-4 text-white shadow-lg">
      <div className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-[color-mix(in_srgb,var(--ks-secondary-container)_20%,transparent)] blur-2xl" />
      <div className="relative z-10 mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ks-secondary-container)] px-2.5 py-1 text-[11px] font-bold text-[#5c2000] shadow-sm">
          <Star className="h-3 w-3 fill-current" strokeWidth={0} />
          {t.chefRecommended}
        </span>
      </div>
      <div className="relative z-10 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => onOpen(product)} className="w-full text-left">
            <h2 className="font-display text-lg font-bold leading-snug text-white">
              {product.name}
            </h2>
            {product.description ? (
              <p className="mt-1 line-clamp-2 text-xs text-stone-300">{product.description}</p>
            ) : null}
          </button>
          <div className="mt-3 flex items-center gap-2">
            {price ? (
              <span className="font-display text-2xl font-black text-amber-300">{price}</span>
            ) : null}
            {showAdd ? (
              <button
                type="button"
                disabled={busy || ordering!.loading}
                onClick={() => void handleAdd()}
                className="ml-auto flex items-center gap-1 rounded-full bg-[var(--ks-secondary)] px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition hover:bg-[var(--ks-secondary-container)] disabled:opacity-50"
              >
                {busy || ordering!.loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShoppingCart className="h-3.5 w-3.5" strokeWidth={2} />
                )}
                {t.addToCart}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpen(product)}
                className="ml-auto rounded-full bg-[var(--ks-secondary)] px-3.5 py-1.5 text-xs font-bold text-white shadow-md"
              >
                {t.showMore}
              </button>
            )}
          </div>
        </div>
        {product.imageUrl ? (
          <button
            type="button"
            onClick={() => onOpen(product)}
            className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/20 shadow-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </button>
        ) : null}
      </div>
    </section>
  );
}
