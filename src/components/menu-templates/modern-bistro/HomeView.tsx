"use client";

import { useMemo } from "react";
import { Search } from "lucide-react";

import type { MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { MenuCategoryScrollSentinel } from "../shared/MenuCategoryScrollSentinel";
import { MenuProductScrollSentinel } from "../shared/MenuProductScrollSentinel";
import { useMenuLocale } from "../shared/menu-locale";

import {
  MODERN_BISTRO_POPULAR_TAB,
  type ModernBistroHomeTab,
  modernBistroHomeProducts,
  modernBistroPopularProducts,
} from "./category-utils";
import { ModernBistroCategoryRail } from "./CategoryRail";
import { ModernBistroHomeProductList } from "./HomeProductList";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  searchQuery: string;
  activeTab: ModernBistroHomeTab;
  onSearchChange: (value: string) => void;
  onSelectTab: (tab: ModernBistroHomeTab) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function ModernBistroHomeView({
  menu,
  categories,
  products,
  searchQuery,
  activeTab,
  onSearchChange,
  onSelectTab,
  onOpenProduct,
}: HomeViewProps) {
  const { t } = useMenuLocale();
  const visibleProducts = useMemo(
    () => modernBistroHomeProducts(products, categories, activeTab),
    [activeTab, categories, products],
  );
  const hasPopular = modernBistroPopularProducts(products).length > 0;
  const showPopularEmpty =
    activeTab.type === MODERN_BISTRO_POPULAR_TAB && !hasPopular;

  return (
    <div>
      <div className="mx-auto max-w-xl px-4 pt-3 sm:px-6">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mb-muted)]"
            strokeWidth={2}
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.searchCategories}
            className="w-full rounded-full border border-[var(--mb-border)] bg-[var(--mb-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--mb-fg)] outline-none transition-shadow placeholder:text-[var(--mb-muted)] focus:border-[var(--mb-primary)] focus:ring-2 focus:ring-[var(--mb-primary)]/10"
          />
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 pt-3 sm:px-6">
        <ModernBistroCategoryRail
          menuId={menu.menuId}
          categories={categories}
          products={products}
          activeTab={activeTab}
          searchQuery={searchQuery}
          onSelectTab={onSelectTab}
        />
      </div>

      <main className="mx-auto max-w-xl px-4 py-5 sm:px-6">
        {showPopularEmpty ? (
          <div className="mb-5 rounded-2xl border border-dashed border-[var(--mb-border)] bg-[var(--mb-surface)] px-4 py-5 text-center text-sm text-[var(--mb-muted)]">
            {t.noPopularProducts}
          </div>
        ) : null}

        {visibleProducts.length > 0 ? (
          <ModernBistroHomeProductList products={visibleProducts} onOpenProduct={onOpenProduct} />
        ) : activeTab.type === "category" ? (
          <p className="py-16 text-center text-sm text-[var(--mb-muted)]">
            {t.noCategoryProducts}
          </p>
        ) : null}

        <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-4 text-xs text-[var(--mb-muted)]" />
        <MenuCategoryScrollSentinel className="flex min-h-2 items-center justify-center" />
      </main>
    </div>
  );
}
