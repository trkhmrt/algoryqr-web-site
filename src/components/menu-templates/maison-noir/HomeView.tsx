"use client";

import { useMemo } from "react";

import type { MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { MenuCategoryScrollSentinel } from "../shared/MenuCategoryScrollSentinel";
import { usePublicMenuTheme } from "../shared/public-menu-theme";

import { pickChefRecommendedProducts } from "./category-utils";
import { MaisonNoirCategoryGrid } from "./CategoryGrid";
import { MaisonNoirChefRecommendations } from "./ChefRecommendations";
import { MaisonNoirMenuHeroIntro } from "./MenuHeroIntro";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  onSelectCategory: (category: TaxonomyNavNode) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function MaisonNoirHomeView({
  menu,
  categories,
  products,
  onSelectCategory,
  onOpenProduct,
}: HomeViewProps) {
  const theme = usePublicMenuTheme();
  const chefRecommended = useMemo(
    () => pickChefRecommendedProducts(products),
    [products],
  );

  return (
    <main className="mx-auto min-h-[60vh] max-w-xl pb-10">
      <MaisonNoirMenuHeroIntro menu={menu} defaultSlogan={theme.defaultSlogan} />

      <div className="space-y-10 px-8">
        {chefRecommended.length > 0 ? (
          <section className="mn-rise mn-section-panel rounded-none px-4 py-5" style={{ animationDelay: "200ms" }}>
            <MaisonNoirChefRecommendations
              products={chefRecommended}
              onOpenProduct={onOpenProduct}
            />
          </section>
        ) : null}

        <section className="mn-rise" style={{ animationDelay: "280ms" }}>
          <h2 className="text-xs uppercase tracking-[0.28em] text-[var(--mn-primary)]">
            Kategoriler
          </h2>
          <div className="mt-5">
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
