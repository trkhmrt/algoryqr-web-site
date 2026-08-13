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
import { usePublicMenuTheme } from "../shared/public-menu-theme";
import { LuxuryBackButton } from "./LuxuryBackButton";

type CategoryViewProps = {
  category: TaxonomyNavNode;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  onHome: () => void;
  onSelectCategory: (category: TaxonomyNavNode) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function LuxuryCategoryView({
  category,
  categories,
  products,
  onHome,
  onSelectCategory,
  onOpenProduct,
}: CategoryViewProps) {
  const theme = usePublicMenuTheme();
  const isLuxury = theme.id === "luxury";
  const isEditorial = theme.layout === "editorial";
  const isElixir = theme.layout === "elixir";
  const isCardFeed = isEditorial || isElixir;
  const crumbs = getBreadcrumbs(categories, category.categoryId);
  const children = category.children ?? [];
  const items = filterProductsForCategory(products, category);
  const parent = crumbs.length > 1 ? crumbs[crumbs.length - 2] : null;

  const goBack = () => {
    if (parent) onSelectCategory(parent);
    else onHome();
  };

  const rowProps = isElixir
    ? {
        variant: "card" as const,
        className: "elixir-card",
        imageClassName: "h-64 bg-[#181836]",
        titleClassName: "lx-fg font-display font-light",
        priceClassName: "lx-gold font-display font-light",
        descriptionClassName: "lx-muted",
        chipClassName: "bg-[var(--lx-chip)] lx-muted",
        accentChipClassName: "lx-gold-bg text-[var(--lx-primary-fg)]",
        destructiveChipClassName: "bg-[color-mix(in_srgb,var(--lx-destructive)_18%,transparent)] text-[var(--lx-destructive)]",
        imagePlaceholderClassName: "lx-gold",
      }
    : isLuxury
    ? {
        variant: "card" as const,
        className: "rounded-[8px] bg-[var(--lx-card)] border-0 overflow-hidden",
        imageClassName: "h-64 bg-[var(--lx-card)]",
        titleClassName: "font-display lx-card-fg font-semibold",
        priceClassName: "lx-gold font-medium whitespace-nowrap",
        descriptionClassName: "lx-card-muted",
        chipClassName: "bg-[var(--lx-chip)] lx-card-fg text-[10px] tracking-wider uppercase",
        accentChipClassName: "bg-[var(--lx-chip)] lx-card-fg text-[10px] tracking-wider uppercase",
        destructiveChipClassName: "bg-[color-mix(in_srgb,var(--lx-destructive)_20%,transparent)] text-[var(--lx-destructive)]",
        imagePlaceholderClassName: "lx-gold",
      }
    : isEditorial
    ? {
        variant: "card" as const,
        className: "border-[var(--lx-border)] bg-[var(--lx-card)]",
        imageClassName: "bg-[var(--lx-card)]",
        titleClassName: "lx-card-fg font-medium",
        priceClassName:
          "lx-gold-bg px-1.5 py-0.5 text-[11px] font-medium text-[var(--lx-primary-fg)]",
        descriptionClassName: "lx-card-muted",
        chipClassName: "bg-[var(--lx-chip)] lx-card-muted",
        accentChipClassName: "lx-gold-bg text-[var(--lx-primary-fg)]",
        destructiveChipClassName: "bg-[color-mix(in_srgb,var(--lx-destructive)_16%,white)] text-[var(--lx-destructive)]",
        imagePlaceholderClassName: "lx-gold",
      }
    : {
        className: "border-[var(--lx-border)]",
        imageClassName: "bg-[var(--lx-card)]",
        titleClassName: "lx-fg font-display",
        priceClassName: "lx-gold",
        descriptionClassName: "lx-muted",
        chipClassName: "bg-[color-mix(in_oklch,var(--lx-gold)_15%,transparent)] lx-muted",
        accentChipClassName: "bg-[color-mix(in_oklch,var(--lx-gold)_90%,transparent)] text-[var(--lx-primary-fg)]",
        destructiveChipClassName: "bg-[color-mix(in_oklch,var(--lx-destructive)_20%,transparent)] text-[var(--lx-destructive)]",
        imagePlaceholderClassName: "lx-gold",
      };

  return (
    <div className="pb-16">
      <header className="border-b border-[var(--lx-border)] bg-[color-mix(in_oklch,var(--lx-card)_30%,transparent)] px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
        <LuxuryBackButton onClick={goBack} className="mb-3" />
        <nav className="flex flex-wrap items-center gap-1 text-[10px] uppercase tracking-widest lx-muted">
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
        <h1 className="mt-2 font-display text-2xl font-semibold text-gradient-gold">
          {category.name}
        </h1>
        <p className="mt-1 text-[10px] uppercase tracking-widest lx-muted">
          {items.length} tabak
          {children.length > 0 ? ` · ${children.length} alt kategori` : ""}
        </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
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
                    className="rounded-full border border-[var(--lx-border)] bg-[color-mix(in_oklch,var(--lx-card)_60%,transparent)] px-3 py-1.5 text-xs lx-fg"
                  >
                    {child.name}
                    <span className="ml-1 lx-muted">({count})</span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {items.length > 0 ? (
          <section className={isElixir ? "grid grid-cols-1 gap-10" : isLuxury ? "grid grid-cols-1 gap-8 sm:grid-cols-2" : isCardFeed ? "grid grid-cols-1 gap-3" : undefined}>
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
            <div className="py-12 text-center text-sm lx-muted">
              Bu kategoride şu an tabak yok.
            </div>
          )
        )}
        <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-6 text-sm lx-muted" />
      </main>
    </div>
  );
}
