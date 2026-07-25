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

export function AlbaCategoryView({
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
      <header className="border-b border-[var(--ab-border)] bg-[color-mix(in_srgb,var(--ab-surface)_55%,transparent)] backdrop-blur">
        <div className="mx-auto max-w-2xl px-6 pb-8 pt-6">
          <nav className="flex flex-wrap items-center gap-1 text-[11px] uppercase tracking-[0.16em] ab-muted">
            <button type="button" onClick={onHome} className="hover:text-[var(--ab-fg)]">
              Menü
            </button>
            {crumbs.map((c, i) => (
              <span key={c.categoryId} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                {i === crumbs.length - 1 ? (
                  <span className="ab-fg">{c.name}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectCategory(c)}
                    className="hover:text-[var(--ab-fg)]"
                  >
                    {c.name}
                  </button>
                )}
              </span>
            ))}
          </nav>

          <h1 className="mt-4 font-display text-4xl font-semibold ab-fg">
            {category.name}
          </h1>
          <p className="mt-3 text-[11px] uppercase tracking-[0.16em] ab-muted">
            {items.length} ürün
            {children.length > 0 ? ` · ${children.length} alt kategori` : ""}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-24 pt-8">
        {children.length > 0 ? (
          <section className="mb-10">
            <h2 className="mb-4 font-display text-lg font-semibold ab-fg">
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
                    className="group flex items-center justify-between rounded-2xl border border-[var(--ab-border)] bg-[var(--ab-surface)] p-4 text-left transition hover:border-[color-mix(in_srgb,var(--ab-accent)_30%,transparent)]"
                  >
                    <div>
                      <p className="font-display text-base font-semibold ab-fg">
                        {child.name}
                      </p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] ab-muted">
                        {count} ürün
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 ab-muted transition group-hover:translate-x-0.5 group-hover:text-[var(--ab-accent)]" />
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {items.length > 0 ? (
          <section>
            <h2 className="mb-2 font-display text-lg font-semibold ab-fg">Ürünler</h2>
            <div>
              {items.map((item) => (
                <ItemRow key={item.productId} item={item} onOpen={onOpenProduct} />
              ))}
            </div>
          </section>
        ) : (
          children.length === 0 && (
            <div className="py-16 text-center text-sm ab-muted">
              Bu kategoride şu an ürün yok.
            </div>
          )
        )}
        <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-6 text-sm ab-muted" />
      </main>
    </div>
  );
}
