"use client";

import { useMemo } from "react";
import { Search } from "lucide-react";

import type { MenuCategoryApiItem, MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { searchMenuProducts, MenuProductScrollSentinel } from "../shared";
import {
  filterVisibleProducts,
  resolveSubCategories,
} from "./category-utils";
import { SoftProductCard } from "./ProductCard";
import { SOFT_HERO_IMAGE } from "./styles";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  categories: MenuCategoryApiItem[];
  products: MenuProductApiItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeCategoryId: "all" | number;
  onSelectCategory: (id: "all" | number) => void;
  activeSubCategoryId: "all" | number;
  onSelectSubCategory: (id: "all" | number) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function SoftHomeView({
  menu,
  categories,
  products,
  searchQuery,
  onSearchChange,
  activeCategoryId,
  onSelectCategory,
  activeSubCategoryId,
  onSelectSubCategory,
  onOpenProduct,
}: HomeViewProps) {
  const welcome =
    menu.slogan?.trim() || "Hoş geldiniz — menümüze göz atın.";

  const subCategories = useMemo(
    () => resolveSubCategories(categories, activeCategoryId),
    [categories, activeCategoryId],
  );

  const filtered = useMemo(
    () =>
      filterVisibleProducts(
        products,
        categories,
        activeCategoryId,
        activeSubCategoryId,
      ),
    [products, categories, activeCategoryId, activeSubCategoryId],
  );

  const visible = useMemo(
    () =>
      searchQuery.trim()
        ? searchMenuProducts(filtered, searchQuery)
        : filtered,
    [filtered, searchQuery],
  );

  return (
    <div className="min-h-screen pb-16">
      <header className="relative h-[42vh] min-h-[280px] w-full overflow-hidden">
        <img
          src={SOFT_HERO_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--sf-bg)] via-[color-mix(in_srgb,var(--sf-fg)_35%,transparent)] to-[color-mix(in_srgb,var(--sf-fg)_45%,transparent)]" />
        <div className="relative z-10 flex h-full flex-col justify-end px-5 pb-8 pt-10">
          <Badge className="mb-3 w-fit rounded-full border-0 bg-white/90 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--sf-fg)] shadow-sm hover:bg-white/90">
            Dijital Menü
          </Badge>
          <h1 className="font-display text-4xl font-bold leading-none text-white drop-shadow-sm sm:text-5xl">
            {menu.businessName}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85">
            {welcome}
          </p>
        </div>
      </header>

      <div className="sticky top-0 z-30 -mt-4 border-b border-[var(--sf-border)] bg-[color-mix(in_srgb,var(--sf-bg)_88%,transparent)] px-5 pb-3 pt-2 backdrop-blur-xl">
        <div className="relative mx-auto max-w-2xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 sf-muted" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Ürün ara…"
            className="w-full rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] py-3.5 pl-11 pr-4 text-sm shadow-sm sf-fg placeholder:text-[var(--sf-muted)] focus:border-[color-mix(in_srgb,var(--sf-accent)_25%,transparent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--sf-accent)_10%,transparent)]"
          />
        </div>

        <div className="scrollbar-none mx-auto mt-3 flex max-w-2xl gap-2 overflow-x-auto pb-1">
          <CategoryChip
            label="Tümü"
            active={activeCategoryId === "all"}
            onClick={() => onSelectCategory("all")}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat.categoryId}
              label={cat.name}
              active={activeCategoryId === cat.categoryId}
              onClick={() => onSelectCategory(cat.categoryId)}
            />
          ))}
        </div>

        {subCategories.length > 0 ? (
          <div className="scrollbar-none mx-auto mt-2 flex max-w-2xl gap-2 overflow-x-auto pb-1">
            <SubChip
              label="Tümü"
              active={activeSubCategoryId === "all"}
              onClick={() => onSelectSubCategory("all")}
            />
            {subCategories.map((sub) => (
              <SubChip
                key={sub.categoryId}
                label={sub.name}
                active={activeSubCategoryId === sub.categoryId}
                onClick={() => onSelectSubCategory(sub.categoryId)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <main className="mx-auto max-w-2xl px-5 pt-6">
        {visible.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {visible.map((item) => (
              <SoftProductCard
                key={item.productId}
                item={item}
                onOpen={onOpenProduct}
              />
            ))}
            <MenuProductScrollSentinel />
          </div>
        ) : (
          <>
            <p className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-12 text-center text-sm shadow-sm sf-muted">
              {searchQuery.trim()
                ? "Aramanızla eşleşen ürün bulunamadı."
                : "Bu kategoride henüz ürün yok."}
            </p>
            <MenuProductScrollSentinel />
          </>
        )}
      </main>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition active:scale-95 ${
        active
          ? "bg-[var(--sf-accent)] text-[var(--sf-accent-fg)] shadow-sm"
          : "border border-[var(--sf-border)] bg-[var(--sf-surface)] sf-fg hover:bg-[var(--sf-accent-soft)]"
      }`}
    >
      {label}
    </button>
  );
}

function SubChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
        active
          ? "bg-[var(--sf-accent-soft)] sf-fg shadow-sm ring-1 ring-[var(--sf-border)]"
          : "sf-muted hover:bg-[var(--sf-surface)] hover:text-[var(--sf-fg)]"
      }`}
    >
      {label}
    </button>
  );
}
