"use client";

import { useMemo } from "react";
import { BadgeCheck, Search } from "lucide-react";

import type { MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { MenuCategoryName } from "../shared/MenuCategoryName";
import { MenuCampaignRail } from "../shared/MenuCampaignRail";
import { MenuCategoryScrollSentinel } from "../shared/MenuCategoryScrollSentinel";
import { MenuLanguagePicker } from "../shared/MenuLanguagePicker";
import { MenuProductScrollSentinel } from "../shared/MenuProductScrollSentinel";
import { useMenuLocale } from "../shared/menu-locale";
import { usePublicMenuTheme } from "../shared/public-menu-theme";

import { KahveBrandHero } from "./BrandHero";
import { KahveCategoryPills } from "./CategoryPills";
import {
  KAHVE_ALL_TAB,
  type KahveHomeTab,
  kahveFeaturedProducts,
  kahveHomeSections,
  kahveSearchProducts,
} from "./category-utils";
import { KahveFeaturedCard } from "./FeaturedCard";
import { KahveProductSection } from "./ProductSection";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  searchQuery: string;
  activeTab: KahveHomeTab;
  onSearchChange: (value: string) => void;
  onSelectTab: (tab: KahveHomeTab) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
  onBrandClick?: () => void;
};

export function KahveSokagiHomeView({
  menu,
  categories,
  products,
  searchQuery,
  activeTab,
  onSearchChange,
  onSelectTab,
  onOpenProduct,
  onBrandClick,
}: HomeViewProps) {
  const { t } = useMenuLocale();
  const theme = usePublicMenuTheme();
  const trimmedQuery = searchQuery.trim();
  const featured = useMemo(() => kahveFeaturedProducts(products)[0] ?? null, [products]);

  const searchResults = useMemo(
    () => (trimmedQuery ? kahveSearchProducts(products, trimmedQuery) : []),
    [products, trimmedQuery],
  );

  const sections = useMemo(
    () => (trimmedQuery ? [] : kahveHomeSections(products, categories, activeTab)),
    [activeTab, categories, products, trimmedQuery],
  );

  const showFeaturedHero =
    !trimmedQuery && activeTab.type === KAHVE_ALL_TAB && featured != null;

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col">
      <KahveBrandHero menu={menu} onBrandClick={onBrandClick} />

      <main className="flex flex-col gap-3 px-3.5 pb-32 pt-3">
        <MenuCampaignRail />
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lx-muted)]"
              strokeWidth={2}
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={t.searchMenu}
              className="w-full rounded-xl border border-[var(--lx-border)] bg-white py-2.5 pl-9 pr-3 text-sm text-[var(--lx-fg)] outline-none placeholder:text-[var(--lx-muted)] focus:border-[var(--ks-secondary)]"
            />
          </div>
          <MenuLanguagePicker variant="minimal" />
        </div>

        <KahveCategoryPills
          categories={categories}
          products={products}
          activeTab={activeTab}
          onSelectTab={onSelectTab}
        />

        {trimmedQuery ? (
          <section className="flex flex-col gap-2.5">
            {searchResults.length === 0 ? (
              <p className="py-12 text-center text-sm text-[var(--lx-muted)]">
                {t.noProductsFound}
              </p>
            ) : (
              <KahveProductSection products={searchResults} onOpenProduct={onOpenProduct} />
            )}
          </section>
        ) : (
          <>
            {showFeaturedHero ? (
              <KahveFeaturedCard product={featured} onOpen={onOpenProduct} />
            ) : null}

            {sections.length === 0 ? (
              <p className="py-12 text-center text-sm text-[var(--lx-muted)]">
                {t.noCategoryProducts}
              </p>
            ) : (
              sections.map(({ key, title, products: sectionProducts }) => (
                <section key={key} className="flex flex-col gap-2.5">
                  {title ? (
                    <div className="flex items-center justify-between px-0.5">
                      <div className="flex items-center gap-2">
                        <span className="h-4 w-2 rounded-full bg-[var(--ks-secondary)]" />
                        <h3 className="font-display text-base font-bold text-[var(--ks-primary)]">
                          <MenuCategoryName name={title} />
                        </h3>
                      </div>
                      <span className="rounded-full bg-[var(--ks-surface-high)] px-2 py-0.5 text-[11px] font-semibold text-[var(--lx-muted)]">
                        {sectionProducts.length} Çeşit
                      </span>
                    </div>
                  ) : null}
                  <KahveProductSection
                    products={sectionProducts}
                    onOpenProduct={onOpenProduct}
                  />
                </section>
              ))
            )}
          </>
        )}

        <div className="mb-2 mt-4 flex flex-col items-center gap-1.5 rounded-2xl border border-[var(--lx-border)] bg-[var(--ks-surface-high)] p-4 text-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ks-primary)]">
            <BadgeCheck className="h-4 w-4 text-[var(--ks-secondary)]" strokeWidth={2} />
            {theme.footerKicker}
          </div>
          <p className="max-w-xs text-[11px] text-[var(--lx-muted)]">{theme.defaultSlogan}</p>
        </div>

        <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-2 text-xs text-[var(--lx-muted)]" />
        <MenuCategoryScrollSentinel className="flex min-h-2 items-center justify-center" />
      </main>
    </div>
  );
}
