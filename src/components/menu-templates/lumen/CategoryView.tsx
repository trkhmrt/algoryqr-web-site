"use client";

import { ChevronRight } from "lucide-react";

import type { MenuCategoryApiItem, MenuProductApiItem } from "@/lib/api";
import {
  countProductsForCategory,
  filterProductsForCategory,
  getBreadcrumbs,
} from "./category-utils";
import { ItemRow } from "./ItemRow";
import { MenuProductScrollSentinel } from "../shared";

type CategoryViewProps = {
  category: MenuCategoryApiItem;
  categories: MenuCategoryApiItem[];
  products: MenuProductApiItem[];
  onHome: () => void;
  onSelectCategory: (category: MenuCategoryApiItem) => void;
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

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-card)_30%,transparent)] backdrop-blur">
        <div className="mx-auto max-w-2xl px-6 pb-8 pt-6">
          <nav className="flex flex-wrap items-center gap-1 text-[11px] uppercase tracking-widest ln-muted">
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

          <h1 className="mt-4 font-display text-4xl font-semibold text-gradient-gold">
            {category.name}
          </h1>
          <p className="mt-3 text-[11px] uppercase tracking-widest ln-muted">
            {items.length} tabak · {children.length} alt kategori
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-24 pt-8">
        {children.length > 0 ? (
          <section className="mb-10">
            <h2 className="mb-4 font-display text-lg font-semibold ln-fg">
              Alt kategoriler
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {children.map((child) => {
                const count = countProductsForCategory(products, child);
                return (
                  <button
                    key={child.categoryId}
                    type="button"
                    onClick={() => onSelectCategory(child)}
                    className="group flex items-center justify-between rounded-2xl border border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-card)_60%,transparent)] p-4 text-left transition hover:border-[color-mix(in_oklch,var(--ln-gold)_50%,transparent)] hover:bg-[var(--ln-card)]"
                  >
                    <div>
                      <p className="font-display text-base font-semibold ln-fg">
                        {child.name}
                      </p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-widest ln-muted">
                        {count} tabak
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 ln-muted transition group-hover:translate-x-0.5 group-hover:text-[var(--ln-gold)]" />
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {items.length > 0 ? (
          <section>
            <h2 className="mb-4 font-display text-lg font-semibold ln-fg">Tabaklar</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <ItemRow key={item.productId} item={item} onOpen={onOpenProduct} />
              ))}
            </div>
          </section>
        ) : (
          children.length === 0 && (
            <div className="py-16 text-center text-sm ln-muted">
              Bu kategoride şu an tabak yok.
            </div>
          )
        )}
        <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-6 text-sm ln-muted" />
      </main>
    </div>
  );
}
