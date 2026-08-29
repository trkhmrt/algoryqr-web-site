"use client";

import { useMemo } from "react";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { filterProductsByNavNode } from "../types";

import { maisonNoirCategoryMark } from "./styles";

type CategorySliderProps = {
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  activeCategoryId: number | null;
  onSelectCategory: (category: TaxonomyNavNode) => void;
  onShowAll: () => void;
};

export function MaisonNoirCategorySlider({
  categories,
  products,
  activeCategoryId,
  onSelectCategory,
  onShowAll,
}: CategorySliderProps) {
  const cards = useMemo(() => {
    return categories.map((category, index) => {
      const categoryProducts = filterProductsByNavNode(products, category).filter(
        (p) => p.available !== false,
      );
      const coverImage = categoryProducts.find((p) => p.imageUrl)?.imageUrl ?? null;
      return {
        category,
        mark: maisonNoirCategoryMark(index),
        coverImage,
        count: categoryProducts.length,
      };
    });
  }, [categories, products]);

  if (categories.length === 0) return null;

  return (
    <div className="-mx-8 px-8">
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 scrollbar-none">
        <CategoryCard
          active={activeCategoryId == null}
          mark="◆"
          title="Tümü"
          coverImage={null}
          onClick={onShowAll}
        />
        {cards.map(({ category, mark, coverImage, count }) => (
          <CategoryCard
            key={category.categoryId}
            active={activeCategoryId === category.categoryId}
            mark={mark}
            title={category.name}
            subtitle={count > 0 ? `${count} ürün` : undefined}
            coverImage={coverImage}
            onClick={() => onSelectCategory(category)}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryCard({
  active,
  mark,
  title,
  subtitle,
  coverImage,
  onClick,
}: {
  active: boolean;
  mark: string;
  title: string;
  subtitle?: string;
  coverImage: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-36 shrink-0 snap-start overflow-hidden border text-left transition-colors ${
        active
          ? "border-[var(--mn-primary)] bg-[var(--mn-surface)]"
          : "border-[var(--mn-border)] bg-[var(--mn-surface)]/60 hover:border-[var(--mn-primary)]/50"
      }`}
    >
      <div className="relative h-24 w-full overflow-hidden bg-[var(--mn-bg)]">
        {coverImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={coverImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover grayscale-[40%]"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-2xl text-[var(--mn-primary)]/30">
            {mark}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--mn-bg)]/90 via-[var(--mn-bg)]/20 to-transparent" />
      </div>
      <div className="space-y-1 px-3 py-3">
        <p className="mn-tracked text-[0.45rem] text-[var(--mn-primary)]">{mark}</p>
        <p className="line-clamp-2 font-display text-lg leading-tight text-[var(--mn-fg)]">
          {title}
        </p>
        {subtitle ? (
          <p className="text-[0.65rem] text-[var(--mn-muted)]">{subtitle}</p>
        ) : null}
      </div>
    </button>
  );
}
