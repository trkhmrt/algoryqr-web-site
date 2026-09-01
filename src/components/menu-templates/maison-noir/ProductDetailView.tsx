"use client";

import { ChevronLeft } from "lucide-react";
import { useState } from "react";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { resolveProductNavCategory } from "../types";
import { DenseNutritionStrip } from "../shared/dense";
import { useMenuLocale } from "../shared/menu-locale";
import { useOrderingOptional } from "../shared/ordering-context";
import { formatServesPeopleLabel } from "../shared/serves-people";
import { useMenuPriceDisplay } from "../shared/menu-currency";

type ProductDetailViewProps = {
  product: MenuProductApiItem;
  categories: TaxonomyNavNode[];
  onBack: () => void;
};

export function MaisonNoirProductDetailView({
  product,
  categories,
  onBack,
}: ProductDetailViewProps) {
  const price = useMenuPriceDisplay(product.price, product.currency);
  const leafCategory = resolveProductNavCategory(categories, product);
  const categoryLabel =
    leafCategory?.name ?? product.subCategoryName ?? product.mainCategoryName ?? null;
  const ordering = useOrderingOptional();
  const { locale, t } = useMenuLocale();
  const [busy, setBusy] = useState(false);
  const unavailable = product.available === false;
  const chefPick = product.chefRecommended && !unavailable;
  const tags = product.tags ?? [];
  const allergens = product.allergens ?? [];
  const tagSummary = tags.map((tag) => tag.name);
  const allergenSummary = allergens.map((allergen) => allergen.name);
  const servesLabel = formatServesPeopleLabel(
    product.servesPeopleMin,
    product.servesPeopleMax,
    locale,
  );
  const hasMetaSummary =
    tagSummary.length > 0 || allergenSummary.length > 0 || Boolean(servesLabel);

  return (
    <div className="min-h-[60vh] pb-8">
      <div className="sticky top-12 z-30 border-b border-[var(--mn-border)] bg-[var(--mn-bg)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-start gap-2.5 px-5 py-2 sm:px-7">
          <button
            type="button"
            onClick={onBack}
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--mn-border)] text-[var(--mn-fg)] transition-colors hover:border-[var(--mn-primary)]/50 hover:text-[var(--mn-primary)]"
            aria-label={t.back}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <div className="min-w-0 flex-1">
            {chefPick ? (
              <p className="mb-0.5 mn-type-eyebrow text-[var(--mn-primary)]">
                {t.chefRecommended}
              </p>
            ) : null}
            <div className="flex items-start justify-between gap-3">
              <h1 className="min-w-0 mn-type-product text-[var(--mn-fg)]">{product.name}</h1>
              {price ? (
                <span className="mn-type-price shrink-0 text-[var(--mn-primary)]">{price}</span>
              ) : null}
            </div>
            {categoryLabel ? (
              <p className="mt-0.5 truncate mn-type-label text-[var(--mn-muted)]">
                {categoryLabel}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-5 sm:px-7">
        {product.imageUrl ? (
          <div className="mt-4 overflow-hidden bg-[var(--mn-surface)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.name}
              className="mx-auto aspect-[16/10] max-h-[200px] w-full object-cover"
            />
          </div>
        ) : null}

        {product.description ? (
          <p className="mt-4 mn-type-body text-[var(--mn-muted)]">{product.description}</p>
        ) : null}

        {hasMetaSummary ? (
          <div className="mt-4 space-y-1.5 border-t border-[var(--mn-border)] pt-4">
            {tagSummary.length > 0 ? (
              <p className="mn-type-label leading-relaxed text-[var(--mn-muted)]">
                <span className="text-[var(--mn-subtle)]">{t.contentLabel} · </span>
                {tagSummary.join(" · ")}
              </p>
            ) : null}
            {allergenSummary.length > 0 ? (
              <p className="mn-type-label leading-relaxed text-[var(--mn-muted)]">
                <span className="text-[var(--mn-subtle)]">{t.allergenInfo} · </span>
                {allergenSummary.join(" · ")}
              </p>
            ) : null}
            {servesLabel ? (
              <p className="mn-type-label leading-relaxed text-[var(--mn-muted)]">
                <span className="text-[var(--mn-subtle)]">{t.servingLabel} · </span>
                {servesLabel}
              </p>
            ) : null}
          </div>
        ) : null}

        {product.nutrition ? (
          <div className="mt-4 border-t border-[var(--mn-border)] pt-4">
            <DenseNutritionStrip
              nutrition={product.nutrition}
              itemClassName="border border-[var(--mn-border)] bg-[var(--mn-surface)]/35"
              labelClassName="text-[var(--mn-muted)]"
              valueClassName="text-[var(--mn-fg)]"
            />
          </div>
        ) : null}

        {ordering && !unavailable ? (
          <button
            type="button"
            disabled={busy || ordering.loading}
            onClick={async () => {
              setBusy(true);
              try {
                await ordering.addProduct(product, 1);
                ordering.setCartOpen(true);
              } finally {
                setBusy(false);
              }
            }}
            className="mt-8 block w-full border border-[var(--mn-primary)]/60 py-4 transition-colors duration-500 hover:bg-[var(--mn-primary)] hover:text-[var(--mn-primary-fg)] disabled:opacity-50"
          >
            <span className="mn-tracked text-[0.62rem]">
              {busy ? "..." : t.addToOrder}
            </span>
          </button>
        ) : null}

        {unavailable ? (
          <p className="mt-8 text-center mn-type-body text-[var(--mn-muted)]">
            {t.productUnavailable}
          </p>
        ) : null}
      </div>
    </div>
  );
}
