"use client";

import { ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { MenuProductScrollSentinel } from "../shared/MenuProductScrollSentinel";

import {
  filterModernBistroCategoryProducts,
  MODERN_BISTRO_CATEGORY_PRODUCT_PAGE_SIZE,
} from "./category-utils";
import { ModernBistroProductRow } from "./ProductRow";
import { ModernBistroSubcategorySlider } from "./SubcategorySlider";

type CategoryViewProps = {
  category: TaxonomyNavNode;
  products: MenuProductApiItem[];
  subCategoryId: number | null;
  onBackToCategories: () => void;
  onSelectSubCategory: (subCategoryId: number | null) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function ModernBistroCategoryView({
  category,
  products,
  subCategoryId,
  onBackToCategories,
  onSelectSubCategory,
  onOpenProduct,
}: CategoryViewProps) {
  const [visibleLimit, setVisibleLimit] = useState(MODERN_BISTRO_CATEGORY_PRODUCT_PAGE_SIZE);

  useEffect(() => {
    setVisibleLimit(MODERN_BISTRO_CATEGORY_PRODUCT_PAGE_SIZE);
  }, [category.categoryId, subCategoryId]);

  const filteredProducts = useMemo(
    () => filterModernBistroCategoryProducts(products, category, subCategoryId),
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
      <div className="sticky top-14 z-30 border-b border-[var(--mb-border)] bg-[var(--mb-bg)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={onBackToCategories}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--mb-border)] bg-[var(--mb-surface)] text-[var(--mb-fg)] transition-colors hover:bg-[#f3f4f6]"
              aria-label="Kategorilere dön"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h1 className="truncate text-lg font-bold tracking-tight text-[var(--mb-fg)]">
              {category.name}
            </h1>
          </div>
          <span className="shrink-0 rounded-full border border-[var(--mb-border)] bg-[var(--mb-surface)] px-2.5 py-1 text-xs text-[var(--mb-muted)]">
            {filteredProducts.length} ürün
          </span>
        </div>

        {hasSubcategories ? (
          <div className="px-4 pb-2.5 sm:px-6">
            <ModernBistroSubcategorySlider
              parentCategory={category}
              products={products}
              activeSubCategoryId={subCategoryId}
              onSelectSubCategory={onSelectSubCategory}
              onResetFilter={() => onSelectSubCategory(null)}
            />
          </div>
        ) : null}
      </div>

      <div className="px-4 pt-4 sm:px-6">
        {displayedProducts.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--mb-muted)]">
            Bu filtrede ürün bulunmuyor.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--mb-border)]">
            {displayedProducts.map((product) => (
              <ModernBistroProductRow
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
              setVisibleLimit((current) => current + MODERN_BISTRO_CATEGORY_PRODUCT_PAGE_SIZE)
            }
            className="mt-6 block w-full rounded-2xl border border-[var(--mb-border)] py-3 text-sm font-medium text-[var(--mb-fg)] transition-colors hover:bg-[var(--mb-surface)]"
          >
            Daha fazla göster
          </button>
        ) : null}

        <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-4 text-xs text-[var(--mb-muted)]" />
      </div>
    </main>
  );
}
