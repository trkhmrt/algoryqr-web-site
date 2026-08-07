"use client";

import { ChevronRight } from "lucide-react";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { DenseProductRow, MenuProductScrollSentinel } from "../shared";
import {
  countProductsForCategory,
  filterProductsForCategory,
  getBreadcrumbs,
} from "./category-utils";

type CategoryViewProps = {
  category: TaxonomyNavNode;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  onHome: () => void;
  onSelectCategory: (category: TaxonomyNavNode) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function LumenCategoryView({
  category,
  categories,
  products,
  onHome,
  onSelectCategory,
  onOpenProduct,
}: CategoryViewProps) {
  const crumbs = getBreadcrumbs(categories, category.categoryId);
  const children = category.children ?? [];
  const items = filterProductsForCategory(products, category);

  const rowProps = {
    className: "border-[var(--ln-border)]",
    imageClassName: "bg-[var(--ln-card)]",
    titleClassName: "ln-fg font-display",
    priceClassName: "ln-gold",
    descriptionClassName: "ln-muted",
    chipClassName: "bg-[color-mix(in_oklch,var(--ln-gold)_15%,transparent)] ln-muted",
    accentChipClassName: "bg-[color-mix(in_oklch,var(--ln-gold)_90%,transparent)] text-[var(--ln-primary-fg)]",
    destructiveChipClassName: "bg-[color-mix(in_oklch,var(--ln-destructive)_20%,transparent)] text-[var(--ln-destructive)]",
    imagePlaceholderClassName: "ln-gold",
  };

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-card)_30%,transparent)] px-4 py-4 backdrop-blur">
        <nav className="flex flex-wrap items-center gap-1 text-[10px] uppercase tracking-widest ln-muted">
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
        <h1 className="mt-2 font-display text-2xl font-semibold text-gradient-gold">
          {category.name}
        </h1>
        <p className="mt-1 text-[10px] uppercase tracking-widest ln-muted">
          {items.length} tabak
          {children.length > 0 ? ` · ${children.length} alt kategori` : ""}
        </p>
      </header>

      <main className="px-4 pb-20 pt-4">
        {children.length > 0 ? (
          <section className="mb-4">
            <div className="flex flex-wrap gap-1.5">
              {children.map((child) => {
                const count = countProductsForCategory(products, child);
                return (
                  <button
                    key={child.categoryId}
                    type="button"
                    onClick={() => onSelectCategory(child)}
                    className="rounded-full border border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-card)_60%,transparent)] px-3 py-1.5 text-xs ln-fg"
                  >
                    {child.name}
                    <span className="ml-1 ln-muted">({count})</span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {items.length > 0 ? (
          <section>
            {items.map((item) => (
              <DenseProductRow
                key={item.productId}
                item={item}
                onOpen={onOpenProduct}
                {...rowProps}
              />
            ))}
          </section>
        ) : (
          children.length === 0 && (
            <div className="py-12 text-center text-sm ln-muted">
              Bu kategoride şu an tabak yok.
            </div>
          )
        )}
        <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-6 text-sm ln-muted" />
      </main>
    </div>
  );
}
