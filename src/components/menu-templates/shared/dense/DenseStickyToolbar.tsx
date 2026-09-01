"use client";

import { Search } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import type { MenuNavCategory } from "../../types";
import { MenuCategoryRail } from "../MenuCategoryRail";
import { useMenuLocaleOptional } from "../menu-locale";

type DenseStickyToolbarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  className?: string;
  innerClassName?: string;
  searchClassName?: string;
  searchIconClassName?: string;
  categories?: MenuNavCategory[];
  activeCategoryKey?: string | null;
  onSelectCategory?: (category: MenuNavCategory) => void;
  activeChipClassName?: string;
  inactiveChipClassName?: string;
  chipClassName?: string;
  extra?: ReactNode;
  subFilters?: ReactNode;
};

export function DenseStickyToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  className,
  innerClassName,
  searchClassName,
  searchIconClassName,
  categories,
  activeCategoryKey,
  onSelectCategory,
  activeChipClassName,
  inactiveChipClassName,
  chipClassName,
  extra,
  subFilters,
}: DenseStickyToolbarProps) {
  const locale = useMenuLocaleOptional();
  const resolvedPlaceholder = searchPlaceholder ?? locale?.t.searchProducts ?? "Ürün ara…";

  return (
    <div className={cn("sticky top-0 z-30 backdrop-blur-xl", className)}>
      <div className={cn("px-4 py-2", innerClassName)}>
        <div className="relative">
          <Search
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
              searchIconClassName,
            )}
          />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={resolvedPlaceholder}
            className={cn(
              "w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2",
              searchClassName,
            )}
          />
        </div>

        {extra ? <div className="mt-2">{extra}</div> : null}

        {categories && categories.length > 0 && onSelectCategory ? (
          <div className="mt-2">
            <MenuCategoryRail
              categories={categories}
              activeKey={activeCategoryKey ?? null}
              onSelect={onSelectCategory}
              chipClassName={chipClassName}
              activeChipClassName={activeChipClassName}
              inactiveChipClassName={inactiveChipClassName}
            />
          </div>
        ) : null}

        {subFilters ? <div className="mt-2">{subFilters}</div> : null}
      </div>
    </div>
  );
}
