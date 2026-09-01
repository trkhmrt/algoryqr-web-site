"use client";

import { cn } from "@/lib/utils";

import { Tx } from "@/components/google-translate-provider";

import type { MenuNavCategory } from "../types";

export type MenuCategoryRailProps = {
  categories: MenuNavCategory[];
  activeKey: string | null;
  onSelect: (category: MenuNavCategory) => void;
  className?: string;
  chipClassName?: string;
  activeChipClassName?: string;
  inactiveChipClassName?: string;
};

export function MenuCategoryRail({
  categories,
  activeKey,
  onSelect,
  className,
  chipClassName,
  activeChipClassName,
  inactiveChipClassName,
}: MenuCategoryRailProps) {
  if (categories.length === 0) return null;

  return (
    <nav
      className={cn(
        "-mx-1 flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      aria-label="Kategoriler"
    >
      {categories.map((category) => {
        const isActive = category.key === activeKey;
        return (
          <button
            key={category.key}
            type="button"
            onClick={() => onSelect(category)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition",
              category.depth > 0 && "text-[13px]",
              chipClassName,
              isActive ? activeChipClassName : inactiveChipClassName,
            )}
            style={
              category.depth > 0
                ? { marginLeft: Math.min(category.depth, 2) * 4 }
                : undefined
            }
            aria-current={isActive ? "true" : undefined}
          >
            {category.depth > 0 ? (
              <>
                · <Tx>{category.name}</Tx>
              </>
            ) : (
              <Tx>{category.name}</Tx>
            )}
          </button>
        );
      })}
    </nav>
  );
}
