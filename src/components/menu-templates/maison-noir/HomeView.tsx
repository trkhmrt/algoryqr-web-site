"use client";

import { useMemo } from "react";

import type { MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { filterProductsByNavNode } from "../types";
import { MenuCategoryScrollSentinel } from "../shared/MenuCategoryScrollSentinel";
import { MenuProductScrollSentinel } from "../shared/MenuProductScrollSentinel";
import { useOrderingOptional } from "../shared/ordering-context";
import { formatMaisonPrice } from "./category-utils";
import { maisonNoirCategoryMark } from "./styles";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  onSelectCategory: (category: TaxonomyNavNode) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function MaisonNoirHomeView({
  menu,
  categories,
  products,
  onSelectCategory,
  onOpenProduct,
}: HomeViewProps) {
  const sections = useMemo(() => {
    if (categories.length === 0) {
      const available = products.filter((p) => p.available !== false);
      if (available.length === 0) return [];
      return [
        {
          key: "all",
          title: "Menü",
          mark: maisonNoirCategoryMark(0),
          category: null as TaxonomyNavNode | null,
          products: available,
        },
      ];
    }

    return categories
      .map((category, index) => {
        const sectionProducts = filterProductsByNavNode(products, category).filter(
          (p) => p.available !== false,
        );
        if (sectionProducts.length === 0) return null;
        return {
          key: String(category.categoryId),
          title: category.name,
          mark: maisonNoirCategoryMark(index),
          category,
          products: sectionProducts,
        };
      })
      .filter(Boolean) as Array<{
      key: string;
      title: string;
      mark: string;
      category: TaxonomyNavNode;
      products: MenuProductApiItem[];
    }>;
  }, [categories, products]);

  const title = menu.slogan?.trim() || "Akşam Menüsü";

  return (
    <main className="mx-auto min-h-[60vh] max-w-xl px-8 pb-8 pt-10">
      <header className="text-center">
        <h1 className="font-display text-5xl tracking-tight text-[var(--mn-fg)]">{title}</h1>
        <div className="mn-hairline mx-auto mt-6 w-24" />
      </header>

      {sections.length > 1 ? (
        <nav className="mt-10 flex justify-center gap-6 overflow-x-auto scrollbar-none">
          {sections.map((section) => (
            <a
              key={section.key}
              href={`#mn-section-${section.key}`}
              className="mn-tracked shrink-0 border-b border-transparent pb-1 text-[0.58rem] text-[var(--mn-muted)] transition-colors hover:border-[var(--mn-primary)] hover:text-[var(--mn-primary)]"
            >
              {section.title}
            </a>
          ))}
        </nav>
      ) : null}

      <div className="mt-16 space-y-16">
        {sections.length === 0 ? (
          <p className="py-16 text-center text-sm text-[var(--mn-muted)]">Ürün bulunamadı.</p>
        ) : (
          sections.map((section) => (
            <section
              key={section.key}
              id={`mn-section-${section.key}`}
              className="scroll-mt-20"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="mn-tracked text-[0.58rem] text-[var(--mn-primary)]">
                  {section.title}
                </h2>
                {section.category ? (
                  <button
                    type="button"
                    onClick={() => onSelectCategory(section.category)}
                    className="mn-tracked text-[0.5rem] text-[var(--mn-muted)] transition-colors hover:text-[var(--mn-primary)]"
                  >
                    Tümü
                  </button>
                ) : null}
              </div>
              <ul className="mt-6 divide-y divide-[var(--mn-border)]">
                {section.products.map((product) => (
                  <ProductRow
                    key={product.productId}
                    product={product}
                    onOpen={onOpenProduct}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-6 text-xs text-[var(--mn-muted)]" />
      <MenuCategoryScrollSentinel className="flex min-h-2 items-center justify-center" />
    </main>
  );
}

function ProductRow({
  product,
  onOpen,
}: {
  product: MenuProductApiItem;
  onOpen: (product: MenuProductApiItem) => void;
}) {
  const ordering = useOrderingOptional();
  const price = formatMaisonPrice(product.price);
  const unavailable = product.available === false;

  return (
    <li>
      <div className="group flex items-start gap-5 py-6">
        <button
          type="button"
          onClick={() => onOpen(product)}
          className="flex min-w-0 flex-1 items-start gap-5 text-left transition-opacity hover:opacity-80"
        >
          <div className="h-20 w-20 shrink-0 overflow-hidden bg-[var(--mn-surface)]">
            {product.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={product.imageUrl}
                alt={product.name}
                width={80}
                height={80}
                loading="lazy"
                className="h-20 w-20 object-cover grayscale-[35%] transition duration-700 group-hover:grayscale-0"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-xl text-[var(--mn-primary)]/40">
                ◆
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-2xl leading-none text-[var(--mn-fg)]">
                {product.name}
              </h3>
              {price ? (
                <span className="font-display text-lg text-[var(--mn-primary)]">{price}</span>
              ) : null}
            </div>
            {product.description ? (
              <p className="mt-3 text-[0.8rem] leading-relaxed text-[var(--mn-muted)]">
                {product.description}
              </p>
            ) : null}
            {unavailable ? (
              <p className="mt-2 text-[0.65rem] tracking-[0.2em] text-[var(--mn-muted)]/70">
                MEVCUT DEĞİL
              </p>
            ) : null}
          </div>
        </button>
        {ordering && !unavailable ? (
          <button
            type="button"
            onClick={async () => {
              await ordering.addProduct(product, 1);
            }}
            disabled={ordering.loading}
            className="mt-1 shrink-0 border border-[var(--mn-primary)]/40 px-3 py-2 mn-tracked text-[0.5rem] text-[var(--mn-primary)] transition-colors hover:bg-[var(--mn-primary)] hover:text-[var(--mn-primary-fg)] disabled:opacity-50"
          >
            Ekle
          </button>
        ) : null}
      </div>
    </li>
  );
}
