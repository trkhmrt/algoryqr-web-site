"use client";

import { useMemo } from "react";
import { MapPin, Phone } from "lucide-react";

import type { MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import { usePublicMenuCategoryStats } from "@/hooks/public-menu/use-public-menu-category-stats";
import type { MenuNavCategory, TaxonomyNavNode } from "../types";
import { findCategoryById, flattenNavCategories } from "../types";
import {
  DenseCategoryGrid,
  DenseFeaturedSlider,
  DenseProductRow,
  DenseStickyToolbar,
  FeedbackForm,
  MenuCategoryScrollSentinel,
  MenuProductScrollSentinel,
  searchMenuProducts,
} from "../shared";
import {
  countProductsForCategory,
  popularProducts,
} from "./category-utils";
import { usePublicMenuTheme } from "../shared/public-menu-theme";
import { LUXURY_HERO_IMAGE } from "./styles";

type FeedbackControl = {
  ratingAvg: number | null;
  ratingCount: number;
  userRating?: number | null;
  submitting?: boolean;
  onSubmit: (score: number, comment?: string) => void | Promise<void>;
};

type HomeViewProps = {
  menu: MenuProfileApiItem;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectCategory: (category: TaxonomyNavNode) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
  feedbackControl?: FeedbackControl;
};

export function LuxuryHomeView({
  menu,
  categories,
  products,
  searchQuery,
  onSearchChange,
  onSelectCategory,
  onOpenProduct,
  feedbackControl,
}: HomeViewProps) {
  const theme = usePublicMenuTheme();
  const popular = useMemo(() => popularProducts(products), [products]);
  const searchResults = useMemo(
    () => (searchQuery.trim() ? searchMenuProducts(products, searchQuery) : []),
    [products, searchQuery],
  );

  const slogan = menu.slogan?.trim() || theme.defaultSlogan;

  const mainCategoriesForStats = useMemo(
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

  const categoryStats = usePublicMenuCategoryStats(menu.menuId, mainCategoriesForStats);

  const categoryGridItems = useMemo(
    () =>
      categories.map((cat, index) => ({
        id: cat.categoryId,
        name: cat.name,
        productCount: countProductsForCategory(products, cat),
        imageUrl:
          cat.kind === "main"
            ? categoryStats.get(cat.mainCategoryId)?.coverImageUrl ?? undefined
            : undefined,
        mark: theme.categoryMarks[index % theme.categoryMarks.length],
        subtitle:
          (cat.children?.length ?? 0) > 0
            ? `${cat.children!.length} alt`
            : undefined,
      })),
    [categories, products, theme.categoryMarks, categoryStats],
  );

  const isLuxury = theme.id === "luxury";
  const isEditorial = theme.layout === "editorial";
  const isElixir = theme.layout === "elixir";
  const isCardFeed = isEditorial || isElixir;
  const rowProps = isElixir
    ? {
        variant: "card" as const,
        className: "elixir-card",
        imageClassName: "h-64 bg-[#181836]",
        titleClassName: "lx-fg font-display font-light",
        priceClassName: "lx-gold font-display font-light",
        descriptionClassName: "lx-muted",
        chipClassName: "bg-[var(--lx-chip)] lx-muted",
        accentChipClassName: "lx-gold-bg text-[var(--lx-primary-fg)]",
        destructiveChipClassName: "bg-[color-mix(in_srgb,var(--lx-destructive)_18%,transparent)] text-[var(--lx-destructive)]",
        imagePlaceholderClassName: "lx-gold",
      }
    : isLuxury
    ? {
        variant: "card" as const,
        className: "rounded-[8px] bg-[var(--lx-card)] border-0 overflow-hidden",
        imageClassName: "h-64 bg-[var(--lx-card)]",
        titleClassName: "font-display lx-card-fg font-semibold",
        priceClassName: "lx-gold font-medium whitespace-nowrap",
        descriptionClassName: "lx-card-muted",
        chipClassName: "bg-[var(--lx-chip)] lx-card-fg text-[10px] tracking-wider uppercase",
        accentChipClassName: "bg-[var(--lx-chip)] lx-card-fg text-[10px] tracking-wider uppercase",
        destructiveChipClassName: "bg-[color-mix(in_srgb,var(--lx-destructive)_20%,transparent)] text-[var(--lx-destructive)]",
        imagePlaceholderClassName: "lx-gold",
      }
    : isEditorial
    ? {
        variant: "card" as const,
        className: "border-[var(--lx-border)] bg-[var(--lx-card)]",
        imageClassName: "bg-[var(--lx-card)]",
        titleClassName: "lx-card-fg font-medium",
        priceClassName:
          "lx-gold-bg px-1.5 py-0.5 text-[11px] font-medium text-[var(--lx-primary-fg)]",
        descriptionClassName: "lx-card-muted",
        chipClassName: "bg-[var(--lx-chip)] lx-card-muted",
        accentChipClassName: "lx-gold-bg text-[var(--lx-primary-fg)]",
        destructiveChipClassName: "bg-[color-mix(in_srgb,var(--lx-destructive)_16%,white)] text-[var(--lx-destructive)]",
        imagePlaceholderClassName: "lx-gold",
      }
    : {
        className: "border-[var(--lx-border)]",
        imageClassName: "bg-[var(--lx-card)]",
        titleClassName: "lx-fg font-display",
        priceClassName: "lx-gold",
        descriptionClassName: "lx-muted",
        chipClassName: "bg-[color-mix(in_oklch,var(--lx-gold)_15%,transparent)] lx-muted",
        accentChipClassName: "bg-[color-mix(in_oklch,var(--lx-gold)_90%,transparent)] text-[var(--lx-primary-fg)]",
        destructiveChipClassName: "bg-[color-mix(in_oklch,var(--lx-destructive)_20%,transparent)] text-[var(--lx-destructive)]",
        imagePlaceholderClassName: "lx-gold",
      };

  const railCategories: MenuNavCategory[] = flattenNavCategories(categories).map((category) => ({
    key: String(category.categoryId),
    mainCategoryId: null,
    subCategoryId: null,
    name: category.name,
    depth: category.depth,
  }));

  return (
    <div className="pb-16">
      <header className="relative min-h-[200px] overflow-hidden sm:min-h-[260px] lg:min-h-[320px]">
        <img
          src={theme.heroImage || LUXURY_HERO_IMAGE}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover ${theme.id === "luxury" ? "opacity-45" : "opacity-80"}`}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[color-mix(in_oklch,var(--lx-bg)_35%,transparent)] to-[var(--lx-bg)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-10 text-center sm:px-6 sm:pt-14 lg:px-8">
          <p className="mb-2 text-[10px] uppercase tracking-[0.22em] lx-muted">
            Hoş geldiniz
          </p>
          <h1 className="font-display text-3xl font-semibold leading-tight text-gradient-gold sm:text-4xl lg:text-5xl">
            {menu.businessName}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm lx-muted sm:text-base">{slogan}</p>
          {(menu.phone || menu.address) && (
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs lx-muted sm:text-sm">
              {menu.address ? (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 lx-gold" />
                  <span className="line-clamp-1">{menu.address}</span>
                </span>
              ) : null}
              {menu.phone ? (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 lx-gold" />
                  {menu.phone}
                </span>
              ) : null}
            </div>
          )}
          {feedbackControl ? (
            <div className="mx-auto mt-5 max-w-md rounded-xl border border-[var(--lx-border)] bg-[color-mix(in_oklch,var(--lx-card)_70%,transparent)] px-3 py-2 text-left">
              <FeedbackForm
                title="Menüyü puanla"
                ratingAvg={feedbackControl.ratingAvg}
                ratingCount={feedbackControl.ratingCount}
                userRating={feedbackControl.userRating}
                submitting={feedbackControl.submitting}
                onSubmit={feedbackControl.onSubmit}
              />
            </div>
          ) : null}
        </div>
      </header>

      <DenseStickyToolbar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        searchPlaceholder="Yemek, malzeme veya kategori ara..."
        className="relative z-10 border-b border-[var(--lx-border)] bg-[color-mix(in_oklch,var(--lx-bg)_88%,transparent)]"
        innerClassName="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8"
        searchClassName="border-[var(--lx-border)] bg-[color-mix(in_oklch,var(--lx-card)_70%,transparent)] lx-fg placeholder:text-[var(--lx-muted)] focus:border-[color-mix(in_oklch,var(--lx-gold)_60%,transparent)] focus:ring-[color-mix(in_oklch,var(--lx-gold)_20%,transparent)]"
        searchIconClassName="lx-muted"
        categories={isCardFeed ? railCategories : undefined}
        onSelectCategory={
          isCardFeed
            ? (category) => {
                const node = findCategoryById(categories, Number(category.key));
                if (node) onSelectCategory(node);
              }
            : undefined
        }
      />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {searchQuery.trim() ? (
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold lx-fg">
              “{searchQuery}” için sonuçlar
            </h2>
            {searchResults.length === 0 ? (
              <p className="py-12 text-center text-sm lx-muted">Sonuç bulunamadı.</p>
            ) : (
              <div className={isLuxury ? "grid grid-cols-1 gap-8 sm:grid-cols-2" : isCardFeed ? "grid grid-cols-1 gap-3" : undefined}>
                {searchResults.map((item) => (
                  <DenseProductRow
                    key={item.productId}
                    item={item}
                    onOpen={onOpenProduct}
                    {...rowProps}
                  />
                ))}
              </div>
            )}
          </section>
        ) : isCardFeed ? (
          <section>
            {products.length === 0 ? (
              <p className="py-12 text-center text-sm lx-muted">Henüz ürün yok.</p>
            ) : (
              <div className={isElixir ? "grid grid-cols-1 gap-10" : isLuxury ? "grid grid-cols-1 gap-8 sm:grid-cols-2" : "grid grid-cols-1 gap-3"}>
                {products.map((item) => (
                  <DenseProductRow
                    key={item.productId}
                    item={item}
                    onOpen={onOpenProduct}
                    {...rowProps}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {popular.length > 0 ? (
              <section className="mb-6">
                <h2 className="mb-2 font-display text-lg font-semibold lx-fg">
                  Öne çıkanlar
                </h2>
                <DenseFeaturedSlider
                  items={popular}
                  onOpen={onOpenProduct}
                  cardClassName="border-[var(--lx-border)] bg-[color-mix(in_oklch,var(--lx-card)_60%,transparent)]"
                  imageClassName="bg-[var(--lx-card)]"
                  titleClassName="lx-fg font-display"
                  priceClassName="bg-[color-mix(in_oklch,var(--lx-gold)_90%,transparent)] text-[var(--lx-primary-fg)]"
                  chipClassName="bg-[color-mix(in_oklch,var(--lx-gold)_15%,transparent)] lx-muted"
                  accentChipClassName="bg-[color-mix(in_oklch,var(--lx-gold)_90%,transparent)] text-[var(--lx-primary-fg)]"
                  destructiveChipClassName="bg-[color-mix(in_oklch,var(--lx-destructive)_20%,transparent)] text-[var(--lx-destructive)]"
                  imagePlaceholderClassName="lx-gold"
                />
              </section>
            ) : null}

            <section>
              <h2 className="mb-3 font-display text-lg font-semibold lx-fg">
                Kategoriler
              </h2>
              {categories.length > 0 ? (
                <>
                <DenseCategoryGrid
                  categories={categoryGridItems}
                  onSelect={(item) => {
                    const cat = categories.find((c) => c.categoryId === item.id);
                    if (cat) onSelectCategory(cat);
                  }}
                  className="grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
                  cardClassName="border-[var(--lx-border)] bg-[color-mix(in_oklch,var(--lx-card)_60%,transparent)]"
                  titleClassName="lx-fg font-display"
                  metaClassName="lx-muted"
                  markClassName="lx-gold bg-[color-mix(in_oklch,var(--lx-gold)_15%,transparent)]"
                />
                <MenuCategoryScrollSentinel className="flex min-h-8 items-center justify-center py-4 text-sm lx-muted" />
                </>
              ) : (
                <p className="py-8 text-center text-sm lx-muted">
                  Henüz kategori yok.
                </p>
              )}
            </section>
          </>
        )}
        <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-6 text-sm lx-muted" />
      </main>
    </div>
  );
}
