"use client";

import { useMemo } from "react";

import type { MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { filterProductsByNavNode } from "../types";
import { MenuCategoryScrollSentinel } from "../shared/MenuCategoryScrollSentinel";
import { MenuProductScrollSentinel } from "../shared/MenuProductScrollSentinel";

import { MaisonNoirCategorySlider } from "./CategorySlider";
import { MaisonNoirChefRecommendations } from "./ChefRecommendations";
import { pickChefRecommendedProducts } from "./category-utils";
import { MaisonNoirProductRow } from "./ProductRow";
import { maisonNoirCategoryMark } from "./styles";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  onSelectCategory: (category: TaxonomyNavNode) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
  onShowAll: () => void;
};

export function MaisonNoirHomeView({
  menu,
  categories,
  products,
  onSelectCategory,
  onOpenProduct,
  onShowAll,
}: HomeViewProps) {
  const chefRecommended = useMemo(
    () => pickChefRecommendedProducts(products),
    [products],
  );

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

      <div className="mt-12 space-y-12">
        <MaisonNoirChefRecommendations
          products={chefRecommended}
          onOpenProduct={onOpenProduct}
        />

        {sections.length > 1 ? (
          <section>
            <h2 className="mn-tracked text-[0.58rem] text-[var(--mn-primary)]">Kategoriler</h2>
            <div className="mt-5">
              <MaisonNoirCategorySlider
                categories={categories}
                products={products}
                activeCategoryId={null}
                onSelectCategory={onSelectCategory}
                onShowAll={onShowAll}
              />
            </div>
          </section>
        ) : null}

        <div className="space-y-16">
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
                    <MaisonNoirProductRow
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
      </div>

      <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-6 text-xs text-[var(--mn-muted)]" />
      <MenuCategoryScrollSentinel className="flex min-h-2 items-center justify-center" />
    </main>
  );
}
