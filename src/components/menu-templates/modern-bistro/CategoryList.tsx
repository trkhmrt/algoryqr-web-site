"use client";

import { ChevronRight } from "lucide-react";
import { useMemo } from "react";

import { usePublicMenuCategoryStats } from "@/hooks/public-menu/use-public-menu-category-stats";
import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { filterProductsByNavNode } from "../types";
import { MenuCategoryName } from "../shared/MenuCategoryName";

import { modernBistroCategoryMark } from "./styles";

type CategoryListProps = {
  menuId: number;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  searchQuery: string;
  onSelectCategory: (category: TaxonomyNavNode) => void;
};

export function ModernBistroCategoryList({
  menuId,
  categories,
  products,
  searchQuery,
  onSelectCategory,
}: CategoryListProps) {
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
    const normalized = searchQuery.trim().toLocaleLowerCase("tr");

    return categories
      .filter((category) => category.kind === "main")
      .filter((category) => {
        if (!normalized) return true;
        return category.name.toLocaleLowerCase("tr").includes(normalized);
      })
      .map((category, index) => {
        const stat = stats.get(category.mainCategoryId);
        const loadedProducts = filterProductsByNavNode(products, category).filter(
          (product) => product.available !== false,
        );
        const coverImage =
          stat?.coverImageUrl ??
          category.imageUrl ??
          loadedProducts.find((product) => product.imageUrl)?.imageUrl ??
          null;

        return {
          category,
          mark: modernBistroCategoryMark(index + 1),
          coverImage,
          productCount: loadedProducts.length,
        };
      });
  }, [categories, products, searchQuery, stats]);

  if (tiles.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-[var(--mb-muted)]">
        {searchQuery.trim() ? "Aramanızla eşleşen kategori bulunamadı." : "Kategori bulunamadı."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {tiles.map(({ category, mark, coverImage, productCount }) => (
        <button
          key={category.categoryId}
          type="button"
          onClick={() => onSelectCategory(category)}
          className="group flex w-full overflow-hidden rounded-2xl border border-[var(--mb-border)] bg-[var(--mb-surface)] text-left shadow-[0_8px_24px_rgba(17,17,17,0.04)] transition hover:border-[var(--mb-primary)]/30"
        >
          <div className="relative h-24 w-28 shrink-0 overflow-hidden bg-[#f3f4f6] sm:h-28 sm:w-32">
            {coverImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={coverImage}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-2xl opacity-40">
                {mark}
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-[var(--mb-fg)] sm:text-lg">
                <MenuCategoryName name={category.name} />
              </p>
              <p className="mt-0.5 text-xs text-[var(--mb-muted)]">{productCount} ürün</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-[var(--mb-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--mb-fg)]" />
          </div>
        </button>
      ))}
    </div>
  );
}
