"use client";

import type { MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { MenuCategoryScrollSentinel } from "../shared/MenuCategoryScrollSentinel";

import { ModernBistroCategoryList } from "./CategoryList";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectCategory: (category: TaxonomyNavNode) => void;
};

export function ModernBistroHomeView({
  menu,
  categories,
  products,
  searchQuery,
  onSearchChange,
  onSelectCategory,
}: HomeViewProps) {
  return (
    <div>
      <div className="sticky top-14 z-30 border-b border-[var(--mb-border)] bg-[var(--mb-bg)]/95 backdrop-blur-md">
        <div className="mx-auto max-w-xl px-4 py-3 sm:px-6">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Kategori ara..."
            className="w-full rounded-full border border-[var(--mb-border)] bg-[var(--mb-surface)] px-4 py-2.5 text-sm text-[var(--mb-fg)] outline-none transition-shadow placeholder:text-[var(--mb-muted)] focus:border-[var(--mb-primary)] focus:ring-2 focus:ring-[var(--mb-primary)]/10"
          />
        </div>
      </div>

      <main className="mx-auto max-w-xl px-4 py-5 sm:px-6">
        <ModernBistroCategoryList
          menuId={menu.menuId}
          categories={categories}
          products={products}
          searchQuery={searchQuery}
          onSelectCategory={onSelectCategory}
        />
        <MenuCategoryScrollSentinel className="flex min-h-2 items-center justify-center" />
      </main>
    </div>
  );
}
