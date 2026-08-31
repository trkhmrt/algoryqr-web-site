"use client";

import { ChevronLeft } from "lucide-react";
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

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((left, right) => {
      const leftChef = left.chefRecommended && left.available !== false ? 1 : 0;
      const rightChef = right.chefRecommended && right.available !== false ? 1 : 0;
      return rightChef - leftChef;
    });
  }, [filteredProducts]);

  const displayedProducts = useMemo(
    () => sortedProducts.slice(0, visibleLimit),
    [sortedProducts, visibleLimit],
  );

  const hasMoreLocal = sortedProducts.length > visibleLimit;
  const hasSubcategories = (category.children ?? []).length > 0;

  return (
    <main className="mx-auto min-h-[60vh] max-w-xl pb-8">
      <div className="sticky top-12 z-30 border-b border-[var(--mn-border)] bg-[var(--mn-bg)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-5 py-2 sm:px-7">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={onBackToCategories}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--mn-border)] text-[var(--mn-fg)] transition-colors hover:border-[var(--mn-primary)]/50 hover:text-[var(--mn-primary)]"
              aria-label="Kategorilere dön"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <h1 className="truncate font-display text-[1.125rem] leading-tight text-[var(--mn-fg)]">
              {category.name}
            </h1>
          </div>
          <span className="shrink-0 rounded-full border border-[var(--mn-border)] bg-[var(--mn-surface)]/70 px-2.5 py-1 mn-type-label text-[var(--mn-muted)]">
            {filteredProducts.length} ürün
          </span>
        </div>

        {hasSubcategories ? (
          <div className="px-4 pb-2 sm:px-6">
            <MaisonNoirSubcategorySlider
              parentCategory={category}
              products={products}
              activeSubCategoryId={subCategoryId}
              onSelectSubCategory={onSelectSubCategory}
              onResetFilter={() => onSelectSubCategory(null)}
            />
          </div>
        ) : null}
      </div>

      <div className="px-5 pt-4 sm:px-7">
        {displayedProducts.length === 0 ? (
          <p className="py-12 text-center mn-type-body text-[var(--mn-muted)]">
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
            className="mt-6 block w-full border border-[var(--mn-primary)]/60 py-3 mn-type-eyebrow text-[var(--mn-primary)] transition-colors hover:bg-[var(--mn-primary)] hover:text-[var(--mn-primary-fg)]"
          >
            Daha fazla göster
          </button>
        ) : null}

        <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-4 mn-type-label text-[var(--mn-muted)]" />
      </div>
    </main>
  );
}
