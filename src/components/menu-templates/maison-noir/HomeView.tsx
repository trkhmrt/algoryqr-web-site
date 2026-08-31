"use client";

import { useMemo } from "react";

import type { MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { MenuCategoryScrollSentinel } from "../shared/MenuCategoryScrollSentinel";

import { pickChefRecommendedProducts } from "./category-utils";
import { MaisonNoirCategoryGrid } from "./CategoryGrid";
import { MaisonNoirChefRecommendations } from "./ChefRecommendations";

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
  const chefRecommended = useMemo(
    () => pickChefRecommendedProducts(products),
    [products],
  );

  return (
    <main className="mx-auto min-h-[60vh] max-w-xl pb-10 pt-5">
      <div className="space-y-8 px-5 sm:px-7">
        {chefRecommended.length > 0 ? (
          <section className="mn-rise mn-section-panel rounded-none px-3 py-4" style={{ animationDelay: "120ms" }}>
            <MaisonNoirChefRecommendations
              products={chefRecommended}
              onOpenProduct={onOpenProduct}
            />
          </section>
        ) : null}

        <section className="mn-rise" style={{ animationDelay: "200ms" }}>
          <h2 className="mn-type-eyebrow text-[var(--mn-fg)]">
            Kategoriler
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
