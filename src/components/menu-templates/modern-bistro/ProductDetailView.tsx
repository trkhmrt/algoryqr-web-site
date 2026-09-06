"use client";

import { ChevronLeft, Minus, Plus, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { useState } from "react";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { useMenuLocale } from "../shared/menu-locale";
import { useOrderingOptional } from "../shared/ordering-context";
import { useMenuPriceDisplay } from "../shared/menu-currency";
import { ModernBistroProductAllergenCard } from "./ProductAllergenCard";
import { ModernBistroProductNutritionCard } from "./ProductNutritionCard";

type ProductDetailViewProps = {
  product: MenuProductApiItem;
  categories: TaxonomyNavNode[];
  onBack: () => void;
};

export function ModernBistroProductDetailView({
  product,
  categories,
  onBack,
}: ProductDetailViewProps) {
  const { t } = useMenuLocale();
  const price = useMenuPriceDisplay(product.price, product.currency);
  const ordering = useOrderingOptional();
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const unavailable = product.available === false;
  const chefPick = product.chefRecommended && !unavailable;
  const allergens = product.allergens ?? [];
  const hasNutrition = Boolean(product.nutrition);
  const hasAllergens = allergens.length > 0;
  const showTransparency = hasNutrition || hasAllergens;

  return (
    <div className="min-h-[60vh] pb-8">
      <div className="mx-auto max-w-xl space-y-4 px-4 pt-3 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-[var(--mb-muted)] transition-colors hover:text-[var(--mb-fg)]"
        >
          <ChevronLeft className="h-4 w-4" />
          {t.back}
        </button>

        <section className="rounded-2xl border border-[var(--mb-border)] bg-[var(--mb-surface)] p-4">
          <div className="flex items-start gap-4">
            <div className="aspect-square w-[11rem] shrink-0 overflow-hidden rounded-xl bg-[var(--mb-muted-surface)] sm:w-[12rem]">
              {product.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[var(--mb-muted)]">
                  <UtensilsCrossed className="h-10 w-10 opacity-40" strokeWidth={1.5} />
                </span>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              {chefPick ? (
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--mb-accent)]">
                  {t.chefRecommended}
                </p>
              ) : null}
              <h1 className="text-lg font-bold leading-tight text-[var(--mb-fg)]">{product.name}</h1>
              {price ? (
                <p className="mt-1.5 text-xl font-bold text-[var(--mb-cta)]">{price}</p>
              ) : null}
              {product.description ? (
                <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-[var(--mb-muted)]">
                  {product.description}
                </p>
              ) : null}

              {ordering && !unavailable ? (
                <>
                  <div className="mt-4 inline-flex w-fit items-center rounded-xl border border-[var(--mb-border)] bg-[var(--mb-surface)]">
                    <button
                      type="button"
                      onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                      className="flex h-9 w-9 items-center justify-center text-[var(--mb-fg)] transition-colors hover:bg-[var(--mb-muted-surface)]"
                      aria-label="-"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[2rem] text-center text-sm font-semibold text-[var(--mb-fg)]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((current) => current + 1)}
                      className="flex h-9 w-9 items-center justify-center text-[var(--mb-fg)] transition-colors hover:bg-[var(--mb-muted-surface)]"
                      aria-label="+"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={busy || ordering.loading}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await ordering.beginAddProduct(product, quantity);
                      } finally {
                        setBusy(false);
                      }
                    }}
                    className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[var(--mb-cta)] px-4 py-3 text-sm font-semibold text-[var(--mb-primary-fg)] transition-opacity disabled:opacity-50"
                  >
                    {busy ? "…" : t.addToCart}
                  </button>
                </>
              ) : null}

              {unavailable ? (
                <p className="mt-4 text-sm text-[var(--mb-muted)]">{t.productUnavailable}</p>
              ) : null}
            </div>
          </div>
        </section>

        {product.nutrition ? (
          <ModernBistroProductNutritionCard nutrition={product.nutrition} labels={t} />
        ) : null}

        {hasAllergens ? (
          <ModernBistroProductAllergenCard allergens={allergens} title={t.allergenInfo} />
        ) : null}

        {showTransparency ? (
          <section className="flex items-start gap-3 rounded-2xl border border-[var(--mb-accent-soft)] bg-[var(--mb-accent-soft)] px-4 py-3.5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--mb-accent)]" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-semibold text-[var(--mb-accent)]">{t.transparencyTitle}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--mb-muted)]">
                {t.transparencySubtitle}
              </p>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
