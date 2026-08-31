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

  const title = menu.slogan?.trim() || "Akşam Menüsü";

  return (
    <main className="mx-auto min-h-[60vh] max-w-xl px-8 pb-8 pt-10">
      <header className="text-center">
        <h1 className="font-display text-5xl tracking-tight text-[var(--mn-fg)]">{title}</h1>
        <div className="mn-hairline mx-auto mt-6 w-24" />
      </header>

      <div className="mt-12 space-y-12">
        <MaisonNoirChefRecommendations
          products={chefRecommended}
          onOpenProduct={onOpenProduct}
        />

        <section>
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
