"use client";

import { ChevronLeft } from "lucide-react";
import { useState } from "react";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { resolveProductNavCategory } from "../types";
import { DenseNutritionStrip } from "../shared/dense";
import { useMenuLocaleOptional } from "../shared/menu-locale";
import { useOrderingOptional } from "../shared/ordering-context";
import { formatServesPeopleLabel } from "../shared/serves-people";
import { useMenuPriceDisplay } from "../shared/menu-currency";

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
  const price = useMenuPriceDisplay(product.price, product.currency);
  const leafCategory = resolveProductNavCategory(categories, product);
  const categoryLabel =
    leafCategory?.name ?? product.subCategoryName ?? product.mainCategoryName ?? null;
  const ordering = useOrderingOptional();
  const locale = useMenuLocaleOptional();
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
  );
  const hasMetaSummary =
    tagSummary.length > 0 || allergenSummary.length > 0 || Boolean(servesLabel);

  return (
    <div className="min-h-[60vh] pb-8">
      <div className="sticky top-14 z-30 border-b border-[var(--mb-border)] bg-[var(--mb-bg)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-start gap-2.5 px-4 py-2.5 sm:px-6">
          <button
            type="button"
            onClick={onBack}
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--mb-border)] bg-[var(--mb-surface)] text-[var(--mb-fg)] transition-colors hover:bg-[#f3f4f6]"
            aria-label="Geri"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            {chefPick ? (
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--mb-accent)]">
                Şef önerisi
              </p>
            ) : null}
            <div className="flex items-start justify-between gap-3">
              <h1 className="min-w-0 text-lg font-bold tracking-tight text-[var(--mb-fg)]">
                {product.name}
              </h1>
              {price ? (
                <span className="shrink-0 text-base font-semibold text-[var(--mb-fg)]">{price}</span>
              ) : null}
            </div>
            {categoryLabel ? (
              <p className="mt-0.5 truncate text-xs text-[var(--mb-muted)]">{categoryLabel}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 sm:px-6">
        {product.imageUrl ? (
          <div className="mt-4 overflow-hidden rounded-2xl bg-[#f3f4f6]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.name}
              className="mx-auto aspect-[16/10] max-h-[220px] w-full object-cover"
            />
          </div>
        ) : null}

        {product.description ? (
          <p className="mt-4 text-sm leading-relaxed text-[var(--mb-muted)]">{product.description}</p>
        ) : null}

        {hasMetaSummary ? (
          <div className="mt-4 space-y-1.5 border-t border-[var(--mb-border)] pt-4">
            {tagSummary.length > 0 ? (
              <p className="text-xs leading-relaxed text-[var(--mb-muted)]">
                <span className="font-medium text-[var(--mb-fg)]">İçerik · </span>
                {tagSummary.join(" · ")}
              </p>
            ) : null}
            {allergenSummary.length > 0 ? (
              <p className="text-xs leading-relaxed text-[var(--mb-muted)]">
                <span className="font-medium text-[var(--mb-fg)]">Alerjen · </span>
                {allergenSummary.join(" · ")}
              </p>
            ) : null}
            {servesLabel ? (
              <p className="text-xs leading-relaxed text-[var(--mb-muted)]">
                <span className="font-medium text-[var(--mb-fg)]">Servis · </span>
                {servesLabel}
              </p>
            ) : null}
          </div>
        ) : null}

        {product.nutrition ? (
          <div className="mt-4 border-t border-[var(--mb-border)] pt-4">
            <DenseNutritionStrip
              nutrition={product.nutrition}
              itemClassName="rounded-xl border border-[var(--mb-border)] bg-[var(--mb-surface)]"
              labelClassName="text-[var(--mb-muted)]"
              valueClassName="text-[var(--mb-fg)]"
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
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--mb-primary)] px-4 py-3.5 text-sm font-semibold text-[var(--mb-primary-fg)] transition-opacity disabled:opacity-50"
          >
            {busy ? "…" : (locale?.t.addToOrder ?? "Siparişe ekle")}
          </button>
        ) : null}

        {unavailable ? (
          <p className="mt-8 text-center text-sm text-[var(--mb-muted)]">
            Bu ürün şu an mevcut değil.
          </p>
        ) : null}
      </div>
    </div>
  );
}
