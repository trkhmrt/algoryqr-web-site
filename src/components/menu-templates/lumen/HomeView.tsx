"use client";

import { useMemo } from "react";
import { MapPin, Phone } from "lucide-react";

import type { MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import {
  DenseCategoryGrid,
  DenseFeaturedSlider,
  DenseProductRow,
  DenseStickyToolbar,
  MenuBrandLogo,
  MenuProductScrollSentinel,
  searchMenuProducts,
} from "../shared";
import {
  categoryEmojiFor,
  countProductsForCategory,
  popularProducts,
} from "./category-utils";
import { LUMEN_HERO_IMAGE } from "./styles";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectCategory: (category: TaxonomyNavNode) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function LumenHomeView({
  menu,
  categories,
  products,
  searchQuery,
  onSearchChange,
  onSelectCategory,
  onOpenProduct,
}: HomeViewProps) {
  const popular = useMemo(() => popularProducts(products), [products]);
  const searchResults = useMemo(
    () => (searchQuery.trim() ? searchMenuProducts(products, searchQuery) : []),
    [products, searchQuery],
  );

  const slogan =
    menu.slogan?.trim() ||
    "Mevsimin en taze malzemeleriyle hazırlanan modern mutfak.";

  const categoryGridItems = useMemo(
    () =>
      categories.map((cat, index) => ({
        id: cat.categoryId,
        name: cat.name,
        productCount: countProductsForCategory(products, cat),
        mark: categoryEmojiFor(cat, categories) || ["◐", "◆", "◇", "◈"][index % 4],
        subtitle:
          (cat.children?.length ?? 0) > 0
            ? `${cat.children!.length} alt`
            : undefined,
      })),
    [categories, products],
  );

  const rowProps = {
    className: "border-[var(--ln-border)]",
    imageClassName: "bg-[var(--ln-card)]",
    titleClassName: "ln-fg font-display",
    priceClassName: "ln-gold",
    descriptionClassName: "ln-muted",
    chipClassName: "bg-[color-mix(in_oklch,var(--ln-gold)_15%,transparent)] ln-muted",
    accentChipClassName: "bg-[color-mix(in_oklch,var(--ln-gold)_90%,transparent)] text-[var(--ln-primary-fg)]",
    destructiveChipClassName: "bg-[color-mix(in_oklch,var(--ln-destructive)_20%,transparent)] text-[var(--ln-destructive)]",
    imagePlaceholderClassName: "ln-gold",
  };

  return (
    <div className="min-h-screen pb-16">
      <header className="relative min-h-[180px] max-h-[220px] overflow-hidden">
        <img
          src={LUMEN_HERO_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[color-mix(in_oklch,var(--ln-bg)_50%,transparent)] to-[var(--ln-bg)]" />
        <div className="relative px-4 pb-5 pt-10 text-center">
          <div className="mb-3 flex justify-center">
            <MenuBrandLogo logoUrl={menu.logoUrl} businessName={menu.businessName} size={64} />
          </div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.22em] ln-muted">
            Hoş geldiniz
          </p>
          <h1 className="font-display text-3xl font-semibold leading-tight text-gradient-gold">
            {menu.businessName}
          </h1>
          <p className="mx-auto mt-2 line-clamp-2 max-w-xs text-xs ln-muted">{slogan}</p>
          {(menu.phone || menu.address) && (
            <div className="mt-3 flex flex-wrap justify-center gap-3 text-[11px] ln-muted">
              {menu.address ? (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 ln-gold" />
                  <span className="line-clamp-1">{menu.address}</span>
                </span>
              ) : null}
              {menu.phone ? (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 ln-gold" />
                  {menu.phone}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </header>

      <DenseStickyToolbar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        searchPlaceholder="Yemek, malzeme veya kategori ara..."
        className="border-b border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-bg)_88%,transparent)]"
        searchClassName="border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-card)_70%,transparent)] ln-fg placeholder:text-[var(--ln-muted)] focus:border-[color-mix(in_oklch,var(--ln-gold)_60%,transparent)] focus:ring-[color-mix(in_oklch,var(--ln-gold)_20%,transparent)]"
        searchIconClassName="ln-muted"
      />

      <main className="px-4 pb-20 pt-4">
        {searchQuery.trim() ? (
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold ln-fg">
              “{searchQuery}” için sonuçlar
            </h2>
            {searchResults.length === 0 ? (
              <p className="py-12 text-center text-sm ln-muted">Sonuç bulunamadı.</p>
            ) : (
              <div>
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
        ) : (
          <>
            {popular.length > 0 ? (
              <section className="mb-6">
                <h2 className="mb-2 font-display text-lg font-semibold ln-fg">
                  Öne çıkanlar
                </h2>
                <DenseFeaturedSlider
                  items={popular}
                  onOpen={onOpenProduct}
                  cardClassName="border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-card)_60%,transparent)]"
                  imageClassName="bg-[var(--ln-card)]"
                  titleClassName="ln-fg font-display"
                  priceClassName="bg-[color-mix(in_oklch,var(--ln-gold)_90%,transparent)] text-[var(--ln-primary-fg)]"
                  chipClassName="bg-[color-mix(in_oklch,var(--ln-gold)_15%,transparent)] ln-muted"
                  accentChipClassName="bg-[color-mix(in_oklch,var(--ln-gold)_90%,transparent)] text-[var(--ln-primary-fg)]"
                  destructiveChipClassName="bg-[color-mix(in_oklch,var(--ln-destructive)_20%,transparent)] text-[var(--ln-destructive)]"
                  imagePlaceholderClassName="ln-gold"
                />
              </section>
            ) : null}

            <section>
              <h2 className="mb-3 font-display text-lg font-semibold ln-fg">
                Kategoriler
              </h2>
              {categories.length > 0 ? (
                <DenseCategoryGrid
                  categories={categoryGridItems}
                  onSelect={(item) => {
                    const cat = categories.find((c) => c.categoryId === item.id);
                    if (cat) onSelectCategory(cat);
                  }}
                  cardClassName="border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-card)_60%,transparent)]"
                  titleClassName="ln-fg font-display"
                  metaClassName="ln-muted"
                  markClassName="ln-gold bg-[color-mix(in_oklch,var(--ln-gold)_15%,transparent)]"
                />
              ) : (
                <p className="py-8 text-center text-sm ln-muted">
                  Henüz kategori yok.
                </p>
              )}
            </section>
          </>
        )}
        <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-6 text-sm ln-muted" />
      </main>
    </div>
  );
}
