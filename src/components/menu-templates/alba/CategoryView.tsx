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

  const rowProps = {
    className: "border-[var(--ab-border)]",
    imageClassName: "bg-[var(--ab-bg-soft)]",
    titleClassName: "ab-fg font-display",
    priceClassName: "ab-accent",
    descriptionClassName: "ab-muted",
    chipClassName: "bg-[var(--ab-accent-soft)] ab-muted",
    accentChipClassName: "bg-[var(--ab-accent)] text-white",
    destructiveChipClassName: "bg-[var(--ab-destructive-soft)] ab-destructive",
    imagePlaceholderClassName: "ab-accent",
  };

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-[var(--ab-border)] bg-[color-mix(in_srgb,var(--ab-surface)_55%,transparent)] px-4 py-4 backdrop-blur">
        <nav className="flex flex-wrap items-center gap-1 text-[10px] uppercase tracking-[0.14em] ab-muted">
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
        <h1 className="mt-2 font-display text-2xl font-semibold ab-fg">
          {category.name}
        </h1>
        <p className="mt-1 text-[10px] uppercase tracking-[0.14em] ab-muted">
          {items.length} ürün
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
                    className="rounded-full border border-[var(--ab-border)] bg-[var(--ab-surface)] px-3 py-1.5 text-xs ab-fg transition hover:border-[color-mix(in_srgb,var(--ab-accent)_35%,transparent)]"
                  >
                    {child.name}
                    <span className="ml-1 ab-muted">({count})</span>
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
            <div className="py-12 text-center text-sm ab-muted">
              Bu kategoride şu an ürün yok.
            </div>
          )
        )}
        <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-6 text-sm ab-muted" />
      </main>
    </div>
  );
}
