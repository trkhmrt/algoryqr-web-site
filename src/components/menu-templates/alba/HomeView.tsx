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
  MenuProductScrollSentinel,
  searchMenuProducts,
} from "../shared";
import {
  categoryMarkFor,
  countProductsForCategory,
  popularProducts,
} from "./category-utils";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectCategory: (category: TaxonomyNavNode) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function AlbaHomeView({
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
    "Sade sunum, seçilmiş lezzetler.";

  const categoryGridItems = useMemo(
    () =>
      categories.map((cat, index) => ({
        id: cat.categoryId,
        name: cat.name,
        productCount: countProductsForCategory(products, cat),
        mark: categoryMarkFor(cat, categories) || ["◇", "○", "△", "□"][index % 4],
        subtitle:
          (cat.children?.length ?? 0) > 0
            ? `${cat.children!.length} alt`
            : undefined,
      })),
    [categories, products],
  );

  const rowProps = {
    className: "border-[var(--ab-border)]",
    imageClassName: "bg-[var(--ab-bg-soft)]",
    titleClassName: "ab-fg font-display",
    priceClassName: "ab-accent",
    descriptionClassName: "ab-muted",
    chipClassName: "bg-[var(--ab-accent-soft)] ab-muted",
    accentChipClassName: "bg-[var(--ab-accent)] text-white",
    destructiveChipClassName: "bg-[var(--ab-destructive-soft)] ab-destructive",
    imagePlaceholderClassName: "ab-accent",
  };

  return (
    <div className="min-h-screen pb-16">
      <header className="relative min-h-[180px] max-h-[220px] overflow-hidden px-4 pb-5 pt-10 text-center">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.24em] ab-muted">
          Dijital menü
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight ab-fg">
          {menu.businessName}
        </h1>
        <p className="mx-auto mt-2 line-clamp-2 max-w-xs text-xs leading-relaxed ab-muted">
          {slogan}
        </p>
        {(menu.phone || menu.address) && (
          <div className="mt-3 flex flex-wrap justify-center gap-3 text-[11px] ab-muted">
            {menu.address ? (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 ab-accent" />
                <span className="line-clamp-1">{menu.address}</span>
              </span>
            ) : null}
            {menu.phone ? (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3 ab-accent" />
                {menu.phone}
              </span>
            ) : null}
          </div>
        )}
      </header>

      <DenseStickyToolbar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        searchPlaceholder="Ürün veya kategori ara…"
        className="border-b border-[var(--ab-border)] bg-[color-mix(in_srgb,var(--ab-bg)_88%,transparent)]"
        searchClassName="border-[var(--ab-border)] bg-[var(--ab-surface)] ab-fg placeholder:text-[var(--ab-muted)] focus:border-[color-mix(in_srgb,var(--ab-accent)_40%,transparent)] focus:ring-[color-mix(in_srgb,var(--ab-accent)_15%,transparent)]"
        searchIconClassName="ab-muted"
      />

      <main className="px-4 pb-20 pt-4">
        {searchQuery.trim() ? (
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold ab-fg">
              “{searchQuery}” sonuçları
            </h2>
            {searchResults.length === 0 ? (
              <p className="py-12 text-center text-sm ab-muted">Sonuç bulunamadı.</p>
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
                <h2 className="mb-2 font-display text-lg font-semibold ab-fg">
                  Öne çıkanlar
                </h2>
                <DenseFeaturedSlider
                  items={popular}
                  onOpen={onOpenProduct}
                  cardClassName="border-[var(--ab-border)] bg-[var(--ab-surface)]"
                  imageClassName="bg-[var(--ab-bg-soft)]"
                  titleClassName="ab-fg font-display"
                  priceClassName="bg-[var(--ab-surface)] ab-accent"
                  chipClassName="bg-[var(--ab-accent-soft)] ab-muted"
                  accentChipClassName="bg-[var(--ab-accent)] text-white"
                  destructiveChipClassName="bg-[var(--ab-destructive-soft)] ab-destructive"
                  imagePlaceholderClassName="ab-accent"
                />
              </section>
            ) : null}

            <section>
              <h2 className="mb-3 font-display text-lg font-semibold ab-fg">
                Kategoriler
              </h2>
              {categories.length > 0 ? (
                <DenseCategoryGrid
                  categories={categoryGridItems}
                  onSelect={(item) => {
                    const cat = categories.find((c) => c.categoryId === item.id);
                    if (cat) onSelectCategory(cat);
                  }}
                  cardClassName="border-[var(--ab-border)] bg-[var(--ab-surface)]"
                  titleClassName="ab-fg font-display"
                  metaClassName="ab-muted"
                  markClassName="ab-accent bg-[var(--ab-accent-soft)]"
                />
              ) : (
                <p className="py-8 text-center text-sm ab-muted">
                  Henüz kategori yok.
                </p>
              )}
            </section>
          </>
        )}
        <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-6 text-sm ab-muted" />
      </main>
    </div>
  );
}
