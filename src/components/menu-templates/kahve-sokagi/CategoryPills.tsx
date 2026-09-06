"use client";

import { useMemo, type ReactNode } from "react";
import { Utensils } from "lucide-react";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { MenuCategoryName } from "../shared/MenuCategoryName";
import { useMenuLocale } from "../shared/menu-locale";
import { cn } from "@/lib/utils";

import {
  KAHVE_ALL_TAB,
  KAHVE_FEATURED_TAB,
  type KahveHomeTab,
  kahveFeaturedProducts,
} from "./category-utils";
import { kahveSokagiCategoryMark } from "./styles";

type KahveCategoryPillsProps = {
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  activeTab: KahveHomeTab;
  onSelectTab: (tab: KahveHomeTab) => void;
};

export function KahveCategoryPills({
  categories,
  products,
  activeTab,
  onSelectTab,
}: KahveCategoryPillsProps) {
  const { t } = useMenuLocale();
  const hasFeatured = kahveFeaturedProducts(products).length > 0;

  const mains = useMemo(
    () => categories.filter((category) => category.kind === "main"),
    [categories],
  );

  const isActive = (tab: KahveHomeTab) => {
    if (tab.type !== activeTab.type) return false;
    if (tab.type === "category" && activeTab.type === "category") {
      return tab.categoryId === activeTab.categoryId;
    }
    return true;
  };

  return (
    <div className="ks-scrollbar-none sticky top-0 z-30 -mx-3.5 flex items-center gap-2 overflow-x-auto border-b border-[var(--lx-border)] bg-[color-mix(in_srgb,var(--ks-surface)_95%,transparent)] px-3.5 py-2.5 backdrop-blur-md">
      <Pill
        active={isActive({ type: KAHVE_ALL_TAB })}
        onClick={() => onSelectTab({ type: KAHVE_ALL_TAB })}
        icon={<Utensils className="h-4 w-4" strokeWidth={2} />}
        label={t.all}
      />
      {hasFeatured ? (
        <Pill
          active={isActive({ type: KAHVE_FEATURED_TAB })}
          onClick={() => onSelectTab({ type: KAHVE_FEATURED_TAB })}
          mark="🔥"
          label={t.popular}
        />
      ) : null}
      {mains.map((category, index) => (
        <Pill
          key={category.categoryId}
          active={isActive({ type: "category", categoryId: category.categoryId })}
          onClick={() => onSelectTab({ type: "category", categoryId: category.categoryId })}
          mark={kahveSokagiCategoryMark(index)}
          label={<MenuCategoryName name={category.name} />}
        />
      ))}
    </div>
  );
}

function Pill({
  active,
  onClick,
  icon,
  mark,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon?: ReactNode;
  mark?: string;
  label: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition active:scale-95",
        active
          ? "bg-[var(--ks-primary)] font-bold text-white shadow-sm"
          : "border border-[var(--lx-border)] bg-[var(--ks-surface-low)] text-[var(--lx-muted)] hover:bg-[var(--ks-surface-high)]",
      )}
    >
      {icon ?? (mark ? <span className="text-sm">{mark}</span> : null)}
      <span>{label}</span>
    </button>
  );
}
