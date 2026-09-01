"use client";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";

import { countModernBistroSubcategoryProducts } from "./category-utils";

type SubcategorySliderProps = {
  parentCategory: TaxonomyNavNode;
  products: MenuProductApiItem[];
  activeSubCategoryId: number | null;
  onSelectSubCategory: (subCategoryId: number | null) => void;
  onResetFilter: () => void;
};

export function ModernBistroSubcategorySlider({
  parentCategory,
  products,
  activeSubCategoryId,
  onSelectSubCategory,
  onResetFilter,
}: SubcategorySliderProps) {
  const subcategories = parentCategory.children ?? [];
  if (subcategories.length === 0) return null;

  const showReset = activeSubCategoryId != null;

  return (
    <div className="space-y-2">
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        <SubcategoryChip
          active={activeSubCategoryId == null}
          label="Tümü"
          onClick={() => onSelectSubCategory(null)}
        />
        {subcategories.map((sub) => {
          const count = countModernBistroSubcategoryProducts(products, sub);
          return (
            <SubcategoryChip
              key={sub.categoryId}
              active={activeSubCategoryId === sub.categoryId}
              label={sub.name}
              count={count}
              onClick={() => onSelectSubCategory(sub.categoryId)}
            />
          );
        })}
      </div>
      {showReset ? (
        <button
          type="button"
          onClick={onResetFilter}
          className="text-xs font-medium text-[var(--mb-accent)] underline underline-offset-2 transition-colors hover:text-[var(--mb-fg)]"
        >
          Alt kategori filtresini sıfırla
        </button>
      ) : null}
    </div>
  );
}

function SubcategoryChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 snap-start rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-[var(--mb-primary)] text-[var(--mb-primary-fg)] shadow-sm"
          : "border border-[var(--mb-primary)] bg-transparent text-[var(--mb-primary)] hover:bg-[var(--mb-cta-soft)]"
      }`}
    >
      {label}
      {count != null ? <span className="ml-1 opacity-70">({count})</span> : null}
    </button>
  );
}
