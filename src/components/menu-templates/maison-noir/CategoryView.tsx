"use client";

import { useEffect, useMemo, useState } from "react";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { MenuProductScrollSentinel } from "../shared/MenuProductScrollSentinel";

import {
  filterMaisonCategoryProducts,
  MAISON_CATEGORY_PRODUCT_PAGE_SIZE,
} from "./category-utils";
import { MaisonNoirProductRow } from "./ProductRow";
import { MaisonNoirSubcategorySlider } from "./SubcategorySlider";

type CategoryViewProps = {
  category: TaxonomyNavNode;
  products: MenuProductApiItem[];
  subCategoryId: number | null;
  onBackToCategories: () => void;
  onSelectSubCategory: (subCategoryId: number | null) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function MaisonNoirCategoryView({
  category,
  products,
  subCategoryId,
  onBackToCategories,
  onSelectSubCategory,
  onOpenProduct,
}: CategoryViewProps) {
  const [visibleLimit, setVisibleLimit] = useState(MAISON_CATEGORY_PRODUCT_PAGE_SIZE);

  useEffect(() => {
    setVisibleLimit(MAISON_CATEGORY_PRODUCT_PAGE_SIZE);
  }, [category.categoryId, subCategoryId]);

  const filteredProducts = useMemo(
    () => filterMaisonCategoryProducts(products, category, subCategoryId),
    [products, category, subCategoryId],
  );

  const displayedProducts = useMemo(
    () => filteredProducts.slice(0, visibleLimit),
    [filteredProducts, visibleLimit],
  );

  const hasMoreLocal = filteredProducts.length > visibleLimit;
  const activeSubName =
    subCategoryId != null
      ? category.children.find((child) => child.categoryId === subCategoryId)?.name
      : null;

  return (
    <main className="mx-auto min-h-[60vh] max-w-xl pb-8">
      <div className="sticky top-14 z-30 border-b border-[var(--mn-border)] bg-[var(--mn-bg)]/95 px-8 py-4 backdrop-blur-md">
        <button
          type="button"
          onClick={onBackToCategories}
          className="text-xs text-[var(--mn-muted)] underline underline-offset-2 transition-colors hover:text-[var(--mn-primary)]"
        >
          ← Kategorilere dön
        </button>

        <header className="mt-4 text-center">
          <h1 className="font-display text-4xl tracking-tight text-[var(--mn-fg)]">
            {category.name}
          </h1>
          {activeSubName ? (
            <p className="mt-2 text-sm text-[var(--mn-primary)]">{activeSubName}</p>
          ) : null}
          <div className="mn-hairline mx-auto mt-4 w-24" />
          <p className="mt-3 text-xs text-[var(--mn-muted)]">
            {filteredProducts.length} ürün
          </p>
        </header>

        <div className="mt-5">
          <MaisonNoirSubcategorySlider
            parentCategory={category}
            products={products}
            activeSubCategoryId={subCategoryId}
            onSelectSubCategory={onSelectSubCategory}
            onResetFilter={() => onSelectSubCategory(null)}
          />
        </div>
      </div>

      <div className="px-8 pt-8">
        {displayedProducts.length === 0 ? (
          <p className="py-16 text-center text-sm text-[var(--mn-muted)]">
            Bu filtrede ürün bulunmuyor.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--mn-border)]">
            {displayedProducts.map((product) => (
              <MaisonNoirProductRow
                key={product.productId}
                product={product}
                onOpen={onOpenProduct}
              />
            ))}
          </ul>
        )}

        {hasMoreLocal ? (
          <button
            type="button"
            onClick={() =>
              setVisibleLimit((current) => current + MAISON_CATEGORY_PRODUCT_PAGE_SIZE)
            }
            className="mt-8 block w-full border border-[var(--mn-primary)]/60 py-4 text-xs uppercase tracking-[0.28em] text-[var(--mn-primary)] transition-colors hover:bg-[var(--mn-primary)] hover:text-[var(--mn-primary-fg)]"
          >
            Daha fazla göster
          </button>
        ) : null}

        <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-6 text-xs text-[var(--mn-muted)]" />
      </div>
    </main>
  );
}
