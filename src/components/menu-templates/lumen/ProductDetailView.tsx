"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";

import type { MenuCategoryApiItem, MenuProductApiItem } from "@/lib/api";
import { formatMenuPrice } from "../types";
import { findCategoryById } from "../types";
import { formatNutritionValue, getBreadcrumbs } from "./category-utils";
import { NutriTile } from "./NutriTile";

type ProductDetailViewProps = {
  product: MenuProductApiItem;
  categories: MenuCategoryApiItem[];
  onBack: () => void;
  onHome: () => void;
  onSelectCategory: (category: MenuCategoryApiItem) => void;
};

export function LumenProductDetailView({
  product,
  categories,
  onBack,
  onHome,
  onSelectCategory,
}: ProductDetailViewProps) {
  const crumbs =
    product.categoryId != null
      ? getBreadcrumbs(categories, product.categoryId)
      : [];
  const leafCategory =
    product.categoryId != null
      ? findCategoryById(categories, product.categoryId)
      : null;

  const price = formatMenuPrice(product.price, product.currency);
  const nutrition = product.nutrition;
  const kcal = formatNutritionValue(nutrition?.energyKcal);
  const protein = formatNutritionValue(nutrition?.protein);
  const carbs = formatNutritionValue(nutrition?.carbohydrate);
  const fat = formatNutritionValue(nutrition?.fat);
  const sugar = formatNutritionValue(nutrition?.sugars);
  const salt = formatNutritionValue(nutrition?.salt);
  const hasNutrition = Boolean(kcal || protein || carbs || fat || sugar || salt);

  return (
    <div className="min-h-screen">
      <div className="relative h-[52vh] min-h-[320px] w-full overflow-hidden bg-[var(--ln-card)]">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-6xl ln-gold">
            ◆
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[color-mix(in_oklch,var(--ln-bg)_50%,transparent)] via-[color-mix(in_oklch,var(--ln-bg)_10%,transparent)] to-[var(--ln-bg)]" />

        <button
          type="button"
          onClick={onBack}
          className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-bg)_60%,transparent)] px-3 py-1.5 text-xs font-medium ln-fg backdrop-blur hover:bg-[color-mix(in_oklch,var(--ln-bg)_80%,transparent)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Geri
        </button>

        {!product.available ? (
          <div className="absolute right-4 top-4">
            <span className="rounded-full bg-[color-mix(in_oklch,var(--ln-destructive)_90%,transparent)] px-2.5 py-1 text-xs font-medium text-[var(--ln-destructive-fg)]">
              Tükendi
            </span>
          </div>
        ) : null}
      </div>

      <main className="mx-auto -mt-16 max-w-2xl px-6 pb-24">
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-[11px] uppercase tracking-widest ln-muted">
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

        <div className="rounded-3xl border border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-card)_70%,transparent)] p-6 backdrop-blur">
          <h1 className="font-display text-4xl font-semibold leading-tight ln-fg">
            {product.name}
          </h1>
          {product.description ? (
            <p className="mt-3 text-sm leading-relaxed ln-muted">{product.description}</p>
          ) : null}
          <div className="mt-5 flex items-end justify-between border-t border-[var(--ln-border)] pt-5">
            <div>
              <p className="text-[11px] uppercase tracking-widest ln-muted">Porsiyon</p>
              <p className="mt-1 text-sm ln-fg">1 tabak</p>
            </div>
            {price ? (
              <span className="font-display text-4xl font-semibold text-gradient-gold">
                {price}
              </span>
            ) : null}
          </div>
        </div>

        {hasNutrition ? (
          <section className="mt-8">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-xl font-semibold ln-fg">
                Besin Değerleri
              </h2>
              <span className="text-[11px] uppercase tracking-widest ln-muted">
                {nutrition?.basis === "PER_100ML" ? "100 ml başına" : "100 g başına"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {kcal ? (
                <NutriTile label="Kalori" value={kcal} unit="kcal" accent />
              ) : null}
              {protein ? <NutriTile label="Protein" value={protein} unit="g" /> : null}
              {carbs ? (
                <NutriTile label="Karbonhidrat" value={carbs} unit="g" />
              ) : null}
              {fat ? <NutriTile label="Yağ" value={fat} unit="g" /> : null}
            </div>

            {(sugar || salt) && (
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                {sugar ? (
                  <div className="flex items-center justify-between rounded-xl border border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-card)_40%,transparent)] px-4 py-2.5">
                    <span className="ln-muted">Şeker</span>
                    <span className="font-medium ln-fg">{sugar} g</span>
                  </div>
                ) : null}
                {salt ? (
                  <div className="flex items-center justify-between rounded-xl border border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-card)_40%,transparent)] px-4 py-2.5">
                    <span className="ln-muted">Tuz</span>
                    <span className="font-medium ln-fg">{salt} g</span>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        ) : null}

        {leafCategory ? (
          <div className="mt-10">
            <button
              type="button"
              onClick={() => onSelectCategory(leafCategory)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-card)_60%,transparent)] px-4 py-2 text-xs font-medium ln-fg hover:border-[color-mix(in_oklch,var(--ln-gold)_50%,transparent)]"
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
