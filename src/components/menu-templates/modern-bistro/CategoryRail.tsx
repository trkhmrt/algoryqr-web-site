"use client";

import { Star } from "lucide-react";
import { useMemo } from "react";

import { usePublicMenuCategoryStats } from "@/hooks/public-menu/use-public-menu-category-stats";
import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { filterProductsByNavNode } from "../types";
import { Tx } from "@/components/google-translate-provider";
import { MenuCategoryName } from "../shared/MenuCategoryName";
import { cn } from "@/lib/utils";

import {
  MODERN_BISTRO_POPULAR_TAB,
  type ModernBistroHomeTab,
  modernBistroPopularProducts,
} from "./category-utils";
import { modernBistroCategoryMark } from "./styles";

export type ModernBistroCategoryRailItem = {
  key: string;
  label: string;
  imageUrl: string | null;
  mark: string;
  tab: ModernBistroHomeTab;
  showStar?: boolean;
};

type ModernBistroCategoryRailProps = {
  menuId: number;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  activeTab: ModernBistroHomeTab;
  searchQuery: string;
  onSelectTab: (tab: ModernBistroHomeTab) => void;
};

export function ModernBistroCategoryRail({
  menuId,
  categories,
  products,
  activeTab,
  searchQuery,
  onSelectTab,
}: ModernBistroCategoryRailProps) {
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
  const popularPreview = useMemo(() => modernBistroPopularProducts(products)[0], [products]);

  const items = useMemo(() => {
    const normalized = searchQuery.trim().toLocaleLowerCase("tr");
    const popularLabel = "Popüler";
    const popularMatches =
      !normalized || popularLabel.toLocaleLowerCase("tr").includes(normalized);

    const categoryItems: ModernBistroCategoryRailItem[] = categories
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
          key: `category-${category.categoryId}`,
          label: category.name,
          imageUrl: coverImage,
          mark: modernBistroCategoryMark(index + 1),
          tab: { type: "category" as const, categoryId: category.categoryId },
        };
      });

    if (!popularMatches) return categoryItems;

    return [
      {
        key: MODERN_BISTRO_POPULAR_TAB,
        label: popularLabel,
        imageUrl: popularPreview?.imageUrl ?? null,
        mark: "★",
        tab: { type: MODERN_BISTRO_POPULAR_TAB },
        showStar: true,
      },
      ...categoryItems,
    ];
  }, [categories, popularPreview, products, searchQuery, stats]);

  if (items.length === 0) {
    return (
      <p className="py-3 text-center text-sm text-[var(--mb-muted)]">
        Aramanızla eşleşen kategori bulunamadı.
      </p>
    );
  }

  const isActive = (tab: ModernBistroHomeTab) => {
    if (tab.type === MODERN_BISTRO_POPULAR_TAB && activeTab.type === MODERN_BISTRO_POPULAR_TAB) {
      return true;
    }
    if (tab.type === "category" && activeTab.type === "category") {
      return tab.categoryId === activeTab.categoryId;
    }
    return false;
  };

  return (
    <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const active = isActive(item.tab);
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelectTab(item.tab)}
            className={cn(
              "flex w-[5.5rem] shrink-0 flex-col items-center gap-2 rounded-2xl px-1.5 py-2 text-center transition",
              active
                ? "bg-[color-mix(in_oklch,var(--mb-primary)_10%,white)] ring-2 ring-[var(--mb-primary)]"
                : "bg-[var(--mb-surface)] ring-1 ring-[var(--mb-border)]",
            )}
          >
            <span className="relative block h-14 w-14 overflow-hidden rounded-full bg-[#f3f4f6]">
              {item.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-lg opacity-50">
                  {item.mark}
                </span>
              )}
              {item.showStar ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--mb-primary)] text-white shadow-sm">
                  <Star className="h-3 w-3 fill-current" strokeWidth={0} />
                </span>
              ) : null}
            </span>
            <span className="line-clamp-2 min-h-[2rem] text-[11px] font-semibold leading-tight text-[var(--mb-fg)]">
              {item.showStar ? <Tx>Popüler</Tx> : <MenuCategoryName name={item.label} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
