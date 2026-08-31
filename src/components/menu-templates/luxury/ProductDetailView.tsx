"use client";

import { ChevronRight } from "lucide-react";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { resolveProductNavCategory } from "../types";
import { useMenuPriceDisplay } from "../shared/menu-currency";
import { AddToOrderButton, DenseMetaChips, DenseNutritionStrip, FeedbackForm } from "../shared";
import { usePublicMenuTheme } from "../shared/public-menu-theme";
import { getBreadcrumbs } from "./category-utils";
import { LuxuryBackButton } from "./LuxuryBackButton";

type FeedbackControl = {
  ratingAvg: number | null;
  ratingCount: number;
  userRating?: number | null;
  submitting?: boolean;
  onSubmit: (score: number, comment?: string) => void | Promise<void>;
};

type ProductDetailViewProps = {
  product: MenuProductApiItem;
  categories: TaxonomyNavNode[];
  onBack: () => void;
  onHome: () => void;
  onSelectCategory: (category: TaxonomyNavNode) => void;
  feedbackControl?: FeedbackControl;
};

export function LuxuryProductDetailView({
  product,
  categories,
  onBack,
  onHome,
  onSelectCategory,
  feedbackControl,
}: ProductDetailViewProps) {
  const theme = usePublicMenuTheme();
  const isLuxury = theme.id === "luxury";
  const isEditorial = theme.layout === "editorial";
  const isElixir = theme.layout === "elixir";
  const leafCategory = resolveProductNavCategory(categories, product);
  const crumbs =
    leafCategory != null ? getBreadcrumbs(categories, leafCategory.categoryId) : [];
  const price = useMenuPriceDisplay(product.price, product.currency);

  return (
    <div className="pb-16">
      {isLuxury ? (
        <div className="px-4 pt-4 pb-0 sm:px-6 lg:px-8">
          <div className="border-2 border-[var(--lx-fg)] p-2 overflow-hidden bg-white/10">
            <div className={`relative w-full overflow-hidden bg-[var(--lx-card)] h-72 sm:h-96 lg:h-[28rem]`}>
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-display text-4xl lx-gold">
                  ◆
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={`relative w-full overflow-hidden bg-[var(--lx-card)] ${isElixir ? "h-[65vh] rounded-b-[40px]" : "h-52 sm:h-72 lg:h-80"}`}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className={`h-full w-full object-cover ${isElixir ? "saturate-50" : ""}`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-4xl lx-gold">
              ◆
            </div>
          )}
          <div className={`absolute inset-0 ${isElixir ? "bg-gradient-to-b from-[#10102e]/30 via-transparent to-[#10102e]/90" : "bg-gradient-to-b from-[color-mix(in_oklch,var(--lx-bg)_50%,transparent)] to-[var(--lx-bg)]"}`} />
          <LuxuryBackButton onClick={onBack} className="absolute left-3 top-3" />
        </div>
      )}

      <main className={`mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 ${isElixir ? "-mt-16" : ""}`}>
        {isLuxury ? (
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--lx-border)] bg-[color-mix(in_srgb,var(--lx-bg)_80%,transparent)] px-2.5 py-1 text-xs font-medium lx-fg backdrop-blur"
          >
            <ChevronRight className="h-3.5 w-3.5 rotate-180" />
            Geri
          </button>
        ) : (
          <nav className="mb-3 flex flex-wrap items-center gap-1 text-[10px] uppercase tracking-widest lx-muted">
            <button type="button" onClick={onHome} className="hover:text-[var(--lx-fg)]">
              Menü
            </button>
            {crumbs.map((c, i) => (
              <span key={c.categoryId} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                {i === crumbs.length - 1 ? (
                  <span className="lx-fg">{c.name}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectCategory(c)}
                    className="hover:text-[var(--lx-fg)]"
                  >
                    {c.name}
                  </button>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className={isElixir ? "elixir-sheet rounded-[40px] p-6" : isLuxury ? "pt-2" : "rounded-2xl border border-[var(--lx-border)] bg-[color-mix(in_oklch,var(--lx-card)_70%,transparent)] p-4"}>
          <DenseMetaChips
            product={product}
            maxAllergens={4}
            maxTags={3}
            chipClassName={isElixir ? "rounded-full border border-white/10 bg-white/5 lx-fg" : isLuxury ? "bg-[var(--lx-card)] lx-card-fg text-[10px] tracking-wider uppercase px-2 py-0.5" : "bg-[color-mix(in_oklch,var(--lx-gold)_15%,transparent)] lx-muted"}
            accentChipClassName={isLuxury ? "bg-[var(--lx-card)] lx-card-fg text-[10px] tracking-wider uppercase px-2 py-0.5" : "bg-[color-mix(in_oklch,var(--lx-gold)_90%,transparent)] text-[var(--lx-primary-fg)]"}
            destructiveChipClassName="bg-[color-mix(in_oklch,var(--lx-destructive)_20%,transparent)] text-[var(--lx-destructive)]"
          />
          <h1 className={`mt-2 font-display leading-tight lx-fg ${isElixir ? "text-3xl font-extralight tracking-wide" : isLuxury ? "text-3xl font-bold sm:text-4xl" : "text-2xl font-semibold"}`}>
            {product.name}
          </h1>
          {price ? (
            <p className={isElixir ? "mt-3 font-display text-2xl font-light lx-gold" : isLuxury ? "mt-1 font-display text-xl font-semibold lx-gold" : "mt-3 font-display text-2xl font-semibold text-gradient-gold"}>
              {price}
            </p>
          ) : null}
          {product.description ? (
            <p className={`mt-3 text-sm leading-relaxed ${isLuxury ? "lx-muted" : "lx-muted"}`}>{product.description}</p>
          ) : null}
          <AddToOrderButton
            product={product}
            className={isEditorial || isElixir || isLuxury ? "mt-5" : undefined}
          />
        </div>

        <div className="mt-4">
          <DenseNutritionStrip
            nutrition={product.nutrition}
            itemClassName="border border-[var(--lx-border)] bg-[color-mix(in_oklch,var(--lx-card)_50%,transparent)]"
            labelClassName="lx-muted"
            valueClassName="lx-fg"
          />
        </div>

        {feedbackControl ? (
          <div className="mt-4 rounded-xl border border-[var(--lx-border)] bg-[color-mix(in_oklch,var(--lx-card)_70%,transparent)] px-3 py-2">
            <FeedbackForm
              title="Ürünü puanla"
              ratingAvg={feedbackControl.ratingAvg}
              ratingCount={feedbackControl.ratingCount}
              userRating={feedbackControl.userRating}
              submitting={feedbackControl.submitting}
              onSubmit={feedbackControl.onSubmit}
            />
          </div>
        ) : null}

        {leafCategory ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => onSelectCategory(leafCategory)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--lx-border)] bg-[color-mix(in_oklch,var(--lx-card)_60%,transparent)] px-3 py-1.5 text-xs font-medium lx-fg"
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
