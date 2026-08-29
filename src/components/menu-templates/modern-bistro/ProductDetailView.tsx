"use client";

import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { useState } from "react";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { formatMenuPrice, resolveProductNavCategory } from "../types";
import { DenseNutritionStrip } from "../shared/dense";
import { useMenuLocaleOptional } from "../shared/menu-locale";
import { useOrderingOptional } from "../shared/ordering-context";
import { getBreadcrumbs } from "./category-utils";

type ProductDetailViewProps = {
  product: MenuProductApiItem;
  categories: TaxonomyNavNode[];
  onBack: () => void;
  onHome: () => void;
  onSelectCategory: (category: TaxonomyNavNode) => void;
};

export function ModernBistroProductDetailView({
  product,
  categories,
  onBack,
  onHome,
  onSelectCategory,
}: ProductDetailViewProps) {
  const price = formatMenuPrice(product.price, product.currency);
  const leafCategory = resolveProductNavCategory(categories, product);
  const crumbs = leafCategory != null ? getBreadcrumbs(categories, leafCategory.categoryId) : [];
  const ordering = useOrderingOptional();
  const locale = useMenuLocaleOptional();
  const [busy, setBusy] = useState(false);
  const unavailable = product.available === false;

  return (
    <div>
      <div className="relative aspect-[4/3] max-h-[420px] w-full overflow-hidden bg-[#f3f4f6]">
        {product.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain object-center" />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl opacity-30">🍽️</div>
        )}
        <button
          type="button"
          onClick={onBack}
          className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-[var(--mb-border)] bg-[var(--mb-surface)]/95 px-3 py-2 text-sm text-[var(--mb-fg)] shadow-sm backdrop-blur"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri
        </button>
      </div>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
        {crumbs.length > 0 ? (
          <nav className="flex flex-wrap items-center gap-1 text-xs text-[var(--mb-muted)]">
            <button type="button" onClick={onHome} className="hover:text-[var(--mb-fg)]">
              Menü
            </button>
            {crumbs.map((crumb) => (
              <span key={crumb.categoryId} className="inline-flex items-center gap-1">
                <span>/</span>
                <button
                  type="button"
                  onClick={() => onSelectCategory(crumb)}
                  className="hover:text-[var(--mb-fg)]"
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </nav>
        ) : null}

        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--mb-fg)]">{product.name}</h1>
          {price ? <p className="text-lg font-semibold text-[var(--mb-fg)]">{price}</p> : null}
          {product.description ? (
            <p className="text-base leading-relaxed text-[var(--mb-muted)]">{product.description}</p>
          ) : null}
        </div>

        {product.nutrition ? <DenseNutritionStrip nutrition={product.nutrition} /> : null}

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
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--mb-primary)] px-4 py-3.5 text-sm font-semibold text-[var(--mb-primary-fg)] transition-opacity disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {locale?.t.addToOrder ?? "Siparişe ekle"}
          </button>
        ) : null}

        {unavailable ? (
          <p className="text-sm text-[var(--mb-muted)]">Bu ürün şu an mevcut değil.</p>
        ) : null}
      </main>
    </div>
  );
}
