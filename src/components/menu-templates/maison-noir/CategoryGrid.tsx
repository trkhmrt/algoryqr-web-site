"use client";

import { useMemo } from "react";

import { usePublicMenuCategoryStats } from "@/hooks/public-menu/use-public-menu-category-stats";
import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { filterProductsByNavNode } from "../types";
import { MenuCategoryName } from "../shared/MenuCategoryName";

import { maisonNoirCategoryMark } from "./styles";

type CategoryGridProps = {
  menuId: number;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  onSelectCategory: (category: TaxonomyNavNode) => void;
};

export function MaisonNoirCategoryGrid({
  menuId,
  categories,
  products,
  onSelectCategory,
}: CategoryGridProps) {
  const mainCategories = useMemo(
    () =>
      categories
        .filter((category) => category.kind === "main")
        .map((category) => ({
          id: category.mainCategoryId,
          name: category.name,
          sortOrder: category.sortOrder,
          slug: "",
          imageUrl: category.imageUrl ?? null,
          subs: (category.children ?? []).map((sub) => ({
            id: sub.subCategoryId ?? sub.categoryId,
            mainCategoryId: category.mainCategoryId,
            slug: "",
            name: sub.name,
            sortOrder: sub.sortOrder,
          })),
        })),
    [categories],
  );

  const stats = usePublicMenuCategoryStats(menuId, mainCategories);

  const tiles = useMemo(() => {
    return categories
      .filter((category) => category.kind === "main")
      .map((category, index) => {
        const stat = stats.get(category.mainCategoryId);
        const loadedProducts = filterProductsByNavNode(products, category).filter(
          (product) => product.available !== false,
        );
        const coverImage =
          stat?.coverImageUrl ??
          loadedProducts.find((product) => product.imageUrl)?.imageUrl ??
          null;

        return {
          category,
          mark: maisonNoirCategoryMark(index),
          coverImage,
        };
      });
  }, [categories, products, stats]);

  if (tiles.length === 0) {
    return (
      <p className="py-16 text-center mn-type-body text-[var(--mn-muted)]">Kategori bulunamadı.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {tiles.map(({ category, mark, coverImage }) => (
        <button
          key={category.categoryId}
          type="button"
          onClick={() => onSelectCategory(category)}
          className="group aspect-square overflow-hidden border border-[var(--mn-border)]/50 bg-[var(--mn-surface)]/40 text-left backdrop-blur-sm transition-colors hover:border-[var(--mn-primary)]/50"
        >
          <div className="relative h-[58%] w-full overflow-hidden bg-[var(--mn-bg)]">
            {coverImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={coverImage}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover grayscale-[35%] transition duration-700 group-hover:grayscale-0"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-xl text-[var(--mn-primary)]/30">
                {mark}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--mn-bg)]/90 via-[var(--mn-bg)]/20 to-transparent" />
          </div>
          <div className="flex h-[42%] items-center px-3 py-2">
            <p className="line-clamp-2 font-display text-[1.1875rem] leading-tight tracking-[-0.01em] text-[var(--mn-fg)] sm:text-[1.375rem]">
              <MenuCategoryName name={category.name} />
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
