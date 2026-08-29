"use client";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { MenuProductScrollSentinel } from "../shared/MenuProductScrollSentinel";

import { MaisonNoirCategorySlider } from "./CategorySlider";
import { filterProductsForCategory } from "./category-utils";
import { MaisonNoirProductRow } from "./ProductRow";

type CategoryViewProps = {
  category: TaxonomyNavNode;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  onSelectCategory: (category: TaxonomyNavNode) => void;
  onShowAll: () => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function MaisonNoirCategoryView({
  category,
  categories,
  products,
  onSelectCategory,
  onShowAll,
  onOpenProduct,
}: CategoryViewProps) {
  const categoryProducts = filterProductsForCategory(products, category).filter(
    (p) => p.available !== false,
  );

  return (
    <main className="mx-auto min-h-[60vh] max-w-xl px-8 pb-8 pt-10">
      <section>
        <h2 className="mn-tracked text-[0.58rem] text-[var(--mn-primary)]">Kategoriler</h2>
        <div className="mt-5">
          <MaisonNoirCategorySlider
            categories={categories}
            products={products}
            activeCategoryId={category.categoryId}
            onSelectCategory={onSelectCategory}
            onShowAll={onShowAll}
          />
        </div>
      </section>

      <header className="mt-12 text-center">
        <h1 className="font-display text-5xl tracking-tight text-[var(--mn-fg)]">
          {category.name}
        </h1>
        <div className="mn-hairline mx-auto mt-6 w-24" />
        <p className="mt-4 mn-tracked text-[0.55rem] text-[var(--mn-muted)]">
          {categoryProducts.length} ürün
        </p>
      </header>

      {categoryProducts.length === 0 ? (
        <p className="mt-16 py-10 text-center text-sm text-[var(--mn-muted)]">
          Bu kategoride ürün bulunmuyor.
        </p>
      ) : (
        <ul className="mt-16 divide-y divide-[var(--mn-border)]">
          {categoryProducts.map((product) => (
            <MaisonNoirProductRow
              key={product.productId}
              product={product}
              onOpen={onOpenProduct}
            />
          ))}
        </ul>
      )}

      <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-6" />
    </main>
  );
}
