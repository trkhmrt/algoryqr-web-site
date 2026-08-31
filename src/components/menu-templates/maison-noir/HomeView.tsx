"use client";

import type { MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { MenuCategoryScrollSentinel } from "../shared/MenuCategoryScrollSentinel";

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
  return (
    <main className="mx-auto min-h-[60vh] max-w-xl pb-10 pt-5">
      <div className="px-5 sm:px-7">
        <section className="mn-rise">
          <h2 className="mn-type-eyebrow text-[var(--mn-fg)]">Kategoriler</h2>
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
