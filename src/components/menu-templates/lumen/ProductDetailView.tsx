"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { formatMenuPrice, resolveProductNavCategory } from "../types";
import { DenseMetaChips, DenseNutritionStrip } from "../shared";
import { getBreadcrumbs } from "./category-utils";

type ProductDetailViewProps = {
  product: MenuProductApiItem;
  categories: TaxonomyNavNode[];
  onBack: () => void;
  onHome: () => void;
  onSelectCategory: (category: TaxonomyNavNode) => void;
};

export function LumenProductDetailView({
  product,
  categories,
  onBack,
  onHome,
  onSelectCategory,
}: ProductDetailViewProps) {
  const leafCategory = resolveProductNavCategory(categories, product);
  const crumbs =
    leafCategory != null ? getBreadcrumbs(categories, leafCategory.categoryId) : [];
  const price = formatMenuPrice(product.price, product.currency);

  return (
    <div className="min-h-screen pb-16">
      <div className="relative h-44 w-full overflow-hidden bg-[var(--ln-card)]">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-4xl ln-gold">
            ◆
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[color-mix(in_oklch,var(--ln-bg)_50%,transparent)] to-[var(--ln-bg)]" />
        <button
          type="button"
          onClick={onBack}
          className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-bg)_70%,transparent)] px-2.5 py-1 text-xs font-medium ln-fg backdrop-blur"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Geri
        </button>
      </div>

      <main className="px-4 pb-20 pt-3">
        <nav className="mb-3 flex flex-wrap items-center gap-1 text-[10px] uppercase tracking-widest ln-muted">
          <button type="button" onClick={onHome} className="hover:text-[var(--ln-fg)]">
            Menü
          </button>
          {crumbs.map((c, i) => (
            <span key={c.categoryId} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              {i === crumbs.length - 1 ? (
                <span className="ln-fg">{c.name}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectCategory(c)}
                  className="hover:text-[var(--ln-fg)]"
                >
                  {c.name}
                </button>
              )}
            </span>
          ))}
        </nav>

        <div className="rounded-2xl border border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-card)_70%,transparent)] p-4">
          <DenseMetaChips
            product={product}
            maxAllergens={4}
            maxTags={3}
            chipClassName="bg-[color-mix(in_oklch,var(--ln-gold)_15%,transparent)] ln-muted"
            accentChipClassName="bg-[color-mix(in_oklch,var(--ln-gold)_90%,transparent)] text-[var(--ln-primary-fg)]"
            destructiveChipClassName="bg-[color-mix(in_oklch,var(--ln-destructive)_20%,transparent)] text-[var(--ln-destructive)]"
          />
          <h1 className="mt-2 font-display text-2xl font-semibold leading-tight ln-fg">
            {product.name}
          </h1>
          {product.description ? (
            <p className="mt-2 text-sm leading-relaxed ln-muted">{product.description}</p>
          ) : null}
          {price ? (
            <p className="mt-3 font-display text-2xl font-semibold text-gradient-gold">
              {price}
            </p>
          ) : null}
        </div>

        <div className="mt-4">
          <DenseNutritionStrip
            nutrition={product.nutrition}
            itemClassName="border border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-card)_50%,transparent)]"
            labelClassName="ln-muted"
            valueClassName="ln-fg"
          />
        </div>

        {leafCategory ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => onSelectCategory(leafCategory)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-card)_60%,transparent)] px-3 py-1.5 text-xs font-medium ln-fg"
            >
              {leafCategory.name} kategorisine dön
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
