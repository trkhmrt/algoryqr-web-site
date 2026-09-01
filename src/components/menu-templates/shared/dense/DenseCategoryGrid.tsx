"use client";

import { ChevronRight } from "lucide-react";

import { Tx } from "@/components/google-translate-provider";
import { cn } from "@/lib/utils";

export type DenseCategoryGridItem = {
  id: string | number;
  name: string;
  productCount: number;
  imageUrl?: string;
  mark?: string;
  subtitle?: string;
};

type DenseCategoryGridProps = {
  categories: DenseCategoryGridItem[];
  onSelect: (category: DenseCategoryGridItem) => void;
  className?: string;
  cardClassName?: string;
  titleClassName?: string;
  metaClassName?: string;
  markClassName?: string;
};

export function DenseCategoryGrid({
  categories,
  onSelect,
  className,
  cardClassName,
  titleClassName,
  metaClassName,
  markClassName,
}: DenseCategoryGridProps) {
  if (categories.length === 0) return null;

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {categories.map((category, index) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category)}
          className={cn(
            "group flex flex-col overflow-hidden rounded-2xl border text-left transition active:scale-[0.98]",
            cardClassName,
          )}
        >
          <div className="relative h-20 w-full overflow-hidden">
            {category.imageUrl ? (
              <img
                src={category.imageUrl}
                alt=""
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div
                className={cn(
                  "flex h-full w-full items-center justify-center text-2xl",
                  markClassName,
                )}
              >
                {category.mark ?? ["◇", "○", "△", "□"][index % 4]}
              </div>
            )}
          </div>
          <div className="flex flex-1 items-center justify-between gap-1 p-2.5">
            <div className="min-w-0">
              <p className={cn("truncate text-sm font-semibold leading-tight", titleClassName)}>
                <Tx>{category.name}</Tx>
              </p>
              <p className={cn("mt-0.5 text-[10px] uppercase tracking-wider", metaClassName)}>
                {category.productCount} ürün
                {category.subtitle ? ` · ${category.subtitle}` : ""}
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50 transition group-hover:translate-x-0.5" />
          </div>
        </button>
      ))}
    </div>
  );
}
