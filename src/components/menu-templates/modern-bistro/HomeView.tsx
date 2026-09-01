"use client";

import { useMemo } from "react";

import type { MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { MenuCategoryScrollSentinel } from "../shared/MenuCategoryScrollSentinel";
import { MenuProductScrollSentinel } from "../shared/MenuProductScrollSentinel";

import {
  MODERN_BISTRO_POPULAR_TAB,
  type ModernBistroHomeTab,
  modernBistroHomeProducts,
  modernBistroPopularProducts,
} from "./category-utils";
import { ModernBistroCategoryRail } from "./CategoryRail";
import { ModernBistroHomeProductList } from "./HomeProductList";
import { ModernBistroLocaleCurrencyBar } from "./LocaleCurrencyBar";

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
  const visibleProducts = useMemo(
    () => modernBistroHomeProducts(products, categories, activeTab),
    [activeTab, categories, products],
  );
  const hasPopular = modernBistroPopularProducts(products).length > 0;
  const showPopularEmpty =
    activeTab.type === MODERN_BISTRO_POPULAR_TAB && !hasPopular;

  return (
    <div>
      <div className="sticky top-14 z-30 border-b border-[var(--mb-border)] bg-[var(--mb-bg)]/95 backdrop-blur-md">
        <div className="mx-auto max-w-xl space-y-3 px-4 py-3 sm:px-6">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Kategori ara..."
            className="w-full rounded-full border border-[var(--mb-border)] bg-[var(--mb-surface)] px-4 py-2.5 text-sm text-[var(--mb-fg)] outline-none transition-shadow placeholder:text-[var(--mb-muted)] focus:border-[var(--mb-primary)] focus:ring-2 focus:ring-[var(--mb-primary)]/10"
          />
          <ModernBistroLocaleCurrencyBar />
          <ModernBistroCategoryRail
            menuId={menu.menuId}
            categories={categories}
            products={products}
            activeTab={activeTab}
            searchQuery={searchQuery}
            onSelectTab={onSelectTab}
          />
        </div>
      </div>

      <main className="mx-auto max-w-xl px-4 py-5 sm:px-6">
        {showPopularEmpty ? (
          <div className="mb-5 rounded-2xl border border-dashed border-[var(--mb-border)] bg-[var(--mb-surface)] px-4 py-5 text-center text-sm text-[var(--mb-muted)]">
            Henüz popüler ürün yok. Yukarıdan bir kategori seçerek menüye göz atabilirsiniz.
          </div>
        ) : null}

        {visibleProducts.length > 0 ? (
          <ModernBistroHomeProductList products={visibleProducts} onOpenProduct={onOpenProduct} />
        ) : activeTab.type === "category" ? (
          <p className="py-16 text-center text-sm text-[var(--mb-muted)]">
            Bu kategoride ürün bulunamadı.
          </p>
        ) : null}

        <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-4 text-xs text-[var(--mb-muted)]" />
        <MenuCategoryScrollSentinel className="flex min-h-2 items-center justify-center" />
      </main>
    </div>
  );
}
