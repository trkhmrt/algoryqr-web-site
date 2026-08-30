"use client";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";

import { countMaisonSubcategoryProducts } from "./category-utils";

type SubcategorySliderProps = {
  parentCategory: TaxonomyNavNode;
  products: MenuProductApiItem[];
  activeSubCategoryId: number | null;
  onSelectSubCategory: (subCategoryId: number | null) => void;
  onResetFilter: () => void;
};

export function MaisonNoirSubcategorySlider({
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
    <div className="space-y-3">
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 scrollbar-none">
        <SubcategoryChip
          active={activeSubCategoryId == null}
          label="Tümü"
          onClick={() => onSelectSubCategory(null)}
        />
        {subcategories.map((sub) => {
          const count = countMaisonSubcategoryProducts(products, sub);
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
          className="text-xs text-[var(--mn-primary)] underline underline-offset-2 transition-colors hover:text-[var(--mn-fg)]"
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
      className={`shrink-0 snap-start border px-3 py-2 text-xs transition-colors ${
        active
          ? "border-[var(--mn-primary)] bg-[var(--mn-primary)] text-[var(--mn-primary-fg)]"
          : "border-[var(--mn-border)] bg-[var(--mn-surface)]/60 text-[var(--mn-fg)] hover:border-[var(--mn-primary)]/50"
      }`}
    >
      {label}
      {count != null ? <span className="ml-1 opacity-70">({count})</span> : null}
    </button>
  );
}
