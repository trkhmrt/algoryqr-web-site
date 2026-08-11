"use client";

import { useMemo, type ReactNode } from "react";
import { MapPin, Phone } from "lucide-react";

import type { MainCategoryApiItem, MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import {
  DenseProductRow,
  MenuBrandLogo,
  MenuProductScrollSentinel,
  MenuRatingControl,
  searchMenuProducts,
} from "../shared";
import {
  filterVisibleProducts,
  resolveSubCategories,
} from "./category-utils";
import { SOFT_HERO_IMAGE } from "./styles";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  categories: MainCategoryApiItem[];
  products: MenuProductApiItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeCategoryId: "all" | number;
  onSelectCategory: (id: "all" | number) => void;
  activeSubCategoryId: "all" | number;
  onSelectSubCategory: (id: "all" | number) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
  partySizeControl?: ReactNode;
  ratingControl?: {
    ratingAvg: number | null;
    ratingCount: number;
    userRating?: number | null;
    onRate?: (value: number) => void;
    submitting?: boolean;
  };
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
  partySizeControl,
  ratingControl,
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
      <header className="relative h-[min(220px,32vh)] min-h-[180px] w-full overflow-hidden">
        <img
          src={SOFT_HERO_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--sf-bg)] via-[color-mix(in_srgb,var(--sf-fg)_35%,transparent)] to-[color-mix(in_srgb,var(--sf-fg)_45%,transparent)]" />
        <div className="relative z-10 flex h-full flex-col justify-end px-4 pb-5 pt-8">
          <div className="mb-3">
            <MenuBrandLogo
              logoUrl={menu.logoUrl}
              businessName={menu.businessName}
              size={56}
              className="bg-white/95"
            />
          </div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/80">
            Dijital Menü
          </p>
          <h1 className="font-display text-3xl font-bold leading-none text-white drop-shadow-sm">
            {menu.businessName}
          </h1>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/85">
            {welcome}
          </p>
          {(menu.phone || menu.address) && (
            <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-white/75">
              {menu.address ? (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="line-clamp-1">{menu.address}</span>
                </span>
              ) : null}
              {menu.phone ? (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {menu.phone}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </header>

      <div className="sticky top-0 z-30 -mt-3 border-b border-[var(--sf-border)] bg-[color-mix(in_srgb,var(--sf-bg)_92%,transparent)] backdrop-blur-xl">
        <div className="px-4 py-2">
          <div className="relative">
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Ürün ara…"
              className="w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] py-2.5 pl-3 pr-3 text-sm shadow-sm sf-fg placeholder:text-[var(--sf-muted)] focus:border-[color-mix(in_srgb,var(--sf-accent)_25%,transparent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--sf-accent)_10%,transparent)]"
            />
          </div>

          {partySizeControl ? <div className="mt-2">{partySizeControl}</div> : null}
          {ratingControl ? (
            <div className="mt-2 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium sf-muted">Menüyü puanla</span>
                <MenuRatingControl
                  ratingAvg={ratingControl.ratingAvg}
                  ratingCount={ratingControl.ratingCount}
                  userRating={ratingControl.userRating}
                  onRate={ratingControl.onRate}
                  submitting={ratingControl.submitting}
                />
              </div>
            </div>
          ) : null}

          <div className="scrollbar-none mt-2 flex gap-1.5 overflow-x-auto pb-1">
            <CategoryChip
              label="Tümü"
              active={activeCategoryId === "all"}
              onClick={() => onSelectCategory("all")}
            />
            {categories.map((cat) => (
              <CategoryChip
                key={cat.id}
                label={cat.name}
                active={activeCategoryId === cat.id}
                onClick={() => onSelectCategory(cat.id)}
              />
            ))}
          </div>

          {subCategories.length > 0 ? (
            <div className="scrollbar-none mt-1.5 flex gap-1.5 overflow-x-auto pb-1">
              <SubChip
                label="Tümü"
                active={activeSubCategoryId === "all"}
                onClick={() => onSelectSubCategory("all")}
              />
              {subCategories.map((sub) => (
                <SubChip
                  key={sub.id}
                  label={sub.name}
                  active={activeSubCategoryId === sub.id}
                  onClick={() => onSelectSubCategory(sub.id)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <main className="px-4 pt-3">
        {visible.length > 0 ? (
          <div className="flex flex-col">
            {visible.map((item) => (
              <DenseProductRow
                key={item.productId}
                item={item}
                onOpen={onOpenProduct}
                className="border-[var(--sf-border)]"
                imageClassName="bg-[var(--sf-bg-soft)]"
                titleClassName="sf-fg font-display"
                priceClassName="sf-fg"
                descriptionClassName="sf-muted"
                chipClassName="bg-[var(--sf-bg-soft)] sf-muted"
                accentChipClassName="bg-[var(--sf-accent-soft)] sf-fg"
                destructiveChipClassName="bg-[var(--sf-destructive-soft)] sf-destructive"
                imagePlaceholderClassName="sf-muted"
              />
            ))}
            <MenuProductScrollSentinel />
          </div>
        ) : (
          <>
            <p className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-10 text-center text-sm sf-muted">
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
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
        active
          ? "bg-[var(--sf-accent)] text-[var(--sf-accent-fg)] shadow-sm"
          : "border border-[var(--sf-border)] bg-[var(--sf-surface)] sf-fg"
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
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition active:scale-95 ${
        active
          ? "bg-[var(--sf-accent-soft)] sf-fg ring-1 ring-[var(--sf-border)]"
          : "sf-muted"
      }`}
    >
      {label}
    </button>
  );
}
