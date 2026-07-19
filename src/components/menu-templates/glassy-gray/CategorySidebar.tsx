"use client";

import { useEffect, useState } from "react";

import type { MenuCategoryApiItem } from "@/lib/api";
import { categoryIcon } from "./category-utils";

type CategorySidebarProps = {
  businessName: string;
  slogan?: string;
  phone?: string;
  categories: MenuCategoryApiItem[];
  activeCategoryId: number | null;
  onSelect: (category: MenuCategoryApiItem) => void;
  onHome: () => void;
};

function CategoryTreeItem({
  category,
  depth,
  index,
  activeCategoryId,
  expandedIds,
  onToggle,
  onSelect,
}: {
  category: MenuCategoryApiItem;
  depth: number;
  index: number;
  activeCategoryId: number | null;
  expandedIds: Set<number>;
  onToggle: (id: number) => void;
  onSelect: (category: MenuCategoryApiItem) => void;
}) {
  const children = category.children ?? [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(category.categoryId);
  const isActive = activeCategoryId === category.categoryId;

  return (
    <div>
      <div
        className={`flex w-full items-center gap-1 rounded-lg transition-transform hover:translate-x-1 ${
          isActive ? "gg-primary bg-white/5 font-bold" : "gg-muted"
        }`}
        style={{ paddingLeft: `${8 + depth * 10}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(category.categoryId)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-white/5"
            aria-label={isExpanded ? "Daralt" : "Genislet"}
          >
            <span className="material-symbols-outlined text-lg">
              {isExpanded ? "expand_more" : "chevron_right"}
            </span>
          </button>
        ) : (
          <span className="w-9 shrink-0" />
        )}
        <button
          type="button"
          onClick={() => onSelect(category)}
          className="flex min-w-0 flex-1 items-center gap-2 py-3 pr-3 text-left"
        >
          <span className="material-symbols-outlined text-xl">
            {categoryIcon(index + depth)}
          </span>
          <span className="truncate text-base">{category.name}</span>
        </button>
      </div>
      {hasChildren && isExpanded
        ? children.map((child, childIndex) => (
            <CategoryTreeItem
              key={child.categoryId}
              category={child}
              depth={depth + 1}
              index={childIndex}
              activeCategoryId={activeCategoryId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  );
}

function collectAncestorIds(
  categories: MenuCategoryApiItem[],
  targetId: number,
  trail: number[] = [],
): number[] | null {
  for (const category of categories) {
    const next = [...trail, category.categoryId];
    if (category.categoryId === targetId) return next;
    const found = collectAncestorIds(category.children ?? [], targetId, next);
    if (found) return found;
  }
  return null;
}

export function GlassyGrayCategorySidebar({
  businessName,
  slogan,
  phone,
  categories,
  activeCategoryId,
  onSelect,
  onHome,
}: CategorySidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    if (activeCategoryId == null) return;
    const ancestors = collectAncestorIds(categories, activeCategoryId);
    if (!ancestors) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      for (const id of ancestors) next.add(id);
      return next;
    });
  }, [activeCategoryId, categories]);

  const toggle = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <aside className="gg-aside fixed left-0 z-[60] hidden h-full w-64 flex-col gap-4 border-r border-white/10 p-6 pt-24 shadow-2xl backdrop-blur-3xl lg:flex">
      <button type="button" onClick={onHome} className="mb-4 flex items-center gap-3 text-left">
        <div className="gg-cta-icon flex h-10 w-10 items-center justify-center rounded-xl">
          <span className="material-symbols-outlined">restaurant</span>
        </div>
        <div>
          <div className="gg-display gg-primary text-lg font-bold">{businessName}</div>
          {slogan ? <div className="gg-muted text-xs">{slogan}</div> : null}
        </div>
      </button>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {categories.length === 0 ? (
          <p className="gg-muted px-3 py-2 text-sm">Henuz kategori yok</p>
        ) : (
          categories.map((category, index) => (
            <CategoryTreeItem
              key={category.categoryId}
              category={category}
              depth={0}
              index={index}
              activeCategoryId={activeCategoryId}
              expandedIds={expandedIds}
              onToggle={toggle}
              onSelect={onSelect}
            />
          ))
        )}
      </div>

      {phone ? (
        <a
          href={`tel:${phone.replace(/\s+/g, "")}`}
          className="gg-cta mt-auto block rounded-xl px-6 py-4 text-center font-bold shadow-lg transition-all hover:brightness-110 active:scale-95"
        >
          Book a Table
        </a>
      ) : (
        <button
          type="button"
          className="gg-cta mt-auto rounded-xl px-6 py-4 font-bold shadow-lg transition-all hover:brightness-110 active:scale-95"
        >
          Book a Table
        </button>
      )}
    </aside>
  );
}
