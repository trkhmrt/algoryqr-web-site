"use client";

import { Star } from "lucide-react";
import { useMemo } from "react";

import { usePublicMenuCategoryStats } from "@/hooks/public-menu/use-public-menu-category-stats";
import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { filterProductsByNavNode } from "../types";
import { MenuCategoryName } from "../shared/MenuCategoryName";
import { useMenuLocale } from "../shared/menu-locale";
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
  publicId: string;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  activeTab: ModernBistroHomeTab;
  searchQuery: string;
  onSelectTab: (tab: ModernBistroHomeTab) => void;
};

export function ModernBistroCategoryRail({
  publicId,
  categories,
  products,
  activeTab,
  searchQuery,
  onSelectTab,
}: ModernBistroCategoryRailProps) {
  const { t } = useMenuLocale();
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

  const stats = usePublicMenuCategoryStats(publicId, mainCategories);
  const popularPreview = useMemo(() => modernBistroPopularProducts(products)[0], [products]);

  const items = useMemo(() => {
    const normalized = searchQuery.trim().toLocaleLowerCase("tr");
    const popularLabel = t.popular;
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
  }, [categories, popularPreview, products, searchQuery, stats, t.popular]);

  if (items.length === 0) {
    return (
      <p className="py-3 text-center text-sm text-[var(--mb-muted)]">{t.noSearchCategories}</p>
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
    <div className="-mx-1 flex items-start gap-3 overflow-x-auto px-1 py-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const active = isActive(item.tab);
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelectTab(item.tab)}
            className={cn(
              "flex w-[7.75rem] shrink-0 flex-col rounded-2xl bg-[var(--mb-surface)] p-1 text-center shadow-[var(--mb-card-shadow)] transition",
              active
                ? "border-2 border-[var(--mb-primary)]"
                : "border-2 border-[var(--mb-border)]",
            )}
          >
            <span className="relative aspect-square w-full overflow-hidden rounded-lg bg-[var(--mb-muted-surface)]">
              {item.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl opacity-40">
                  {item.mark}
                </span>
              )}
              {item.showStar ? (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--mb-primary)] text-[var(--mb-primary-fg)] shadow-sm">
                  <Star className="h-3 w-3 fill-current" strokeWidth={0} />
                </span>
              ) : null}
            </span>
            <span className="mt-1 line-clamp-2 w-full px-0.5 text-[15px] font-bold leading-snug text-[var(--mb-fg)]">
              {item.showStar ? t.popular : <MenuCategoryName name={item.label} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
