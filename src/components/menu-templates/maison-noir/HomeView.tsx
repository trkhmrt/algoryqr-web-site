"use client";

import type { MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { MenuCategoryScrollSentinel } from "../shared/MenuCategoryScrollSentinel";
import { MenuCampaignRail } from "../shared/MenuCampaignRail";
import { useMenuLocale } from "../shared/menu-locale";

import { MaisonNoirCategoryGrid } from "./CategoryGrid";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  onSelectCategory: (category: TaxonomyNavNode) => void;
};

export function MaisonNoirHomeView({
  menu,
  categories,
  products,
  onSelectCategory,
}: HomeViewProps) {
  const { t } = useMenuLocale();

  return (
    <main className="mx-auto min-h-[60vh] max-w-xl pb-10 pt-5">
      <div className="px-5 sm:px-7">
        <MenuCampaignRail className="mb-6" />
        <section className="mn-rise">
          <h2 className="font-display text-[1.125rem] uppercase leading-tight tracking-[0.14em] text-[var(--mn-fg)] sm:text-[1.3125rem]">
            {t.categories}
          </h2>
          <div className="mt-4">
            <MaisonNoirCategoryGrid
              menuId={menu.menuId}
              categories={categories}
              products={products}
              onSelectCategory={onSelectCategory}
            />
          </div>
        </section>
      </div>

      <MenuCategoryScrollSentinel className="flex min-h-2 items-center justify-center" />
    </main>
  );
}
