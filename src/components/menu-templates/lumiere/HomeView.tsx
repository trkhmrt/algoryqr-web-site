import { useMemo } from "react";

import type { MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import {
  DenseCategoryGrid,
  DenseProductRow,
  DenseStickyToolbar,
  MenuProductScrollSentinel,
  resolveNavNodeFromRailCategory,
  searchMenuProducts,
  taxonomyNavNodesToRailCategories,
} from "../shared";
import { countProductsForCategory } from "./category-utils";
import { LUMIERE_HERO_IMAGE, lumiereCategoryImage } from "./styles";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelectCategory: (category: TaxonomyNavNode) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function LumiereHomeView({
  menu,
  categories,
  products,
  searchValue,
  onSearchChange,
  onSelectCategory,
  onOpenProduct,
}: HomeViewProps) {
  const slogan =
    menu.slogan?.trim() ||
    "Mevsimlik lezzetlerden oluşan özenle seçilmiş mutfak deneyimi.";

  const navCategories = taxonomyNavNodesToRailCategories(categories);
  const searchResults = searchValue.trim()
    ? searchMenuProducts(products, searchValue)
    : null;

  const categoryGridItems = useMemo(
    () =>
      categories.map((category, index) => ({
        id: category.categoryId,
        name: category.name,
        productCount: countProductsForCategory(products, category),
        imageUrl: lumiereCategoryImage(index),
      })),
    [categories, products],
  );

  const rowProps = {
    className: "border-[var(--lm-outline-variant)]",
    imageClassName: "bg-[var(--lm-surface-container)]",
    titleClassName: "text-[var(--lm-on-surface)]",
    priceClassName: "text-[var(--lm-primary)]",
    descriptionClassName: "text-[var(--lm-on-surface-variant)]",
    chipClassName: "bg-[var(--lm-surface-container)] text-[var(--lm-on-surface-variant)]",
    accentChipClassName: "bg-[var(--lm-primary)] text-white",
    destructiveChipClassName: "bg-[var(--lm-primary-container)] text-white",
    imagePlaceholderClassName: "text-[var(--lm-on-surface-variant)]",
  };

  return (
    <div>
      <section className="relative min-h-[180px] max-h-[220px] w-full overflow-hidden">
        <img
          src={LUMIERE_HERO_IMAGE}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
          <span className="lm-badge mb-1 inline-block rounded px-2 py-0.5 text-[10px] uppercase tracking-widest">
            Bugünün seçkisi
          </span>
          <h2 className="lm-headline-lg mb-1 text-white">Lezzetin inceliği</h2>
          <p className="lm-body-sm line-clamp-2 text-white/80">{slogan}</p>
        </div>
      </section>

      <DenseStickyToolbar
        searchQuery={searchValue}
        onSearchChange={onSearchChange}
        searchPlaceholder="Menüde ürün ara…"
        className="border-b border-[var(--lm-outline-variant)] bg-[color-mix(in_srgb,var(--lm-surface)_92%,transparent)]"
        searchClassName="border-[var(--lm-outline-variant)] bg-[var(--lm-surface-container-lowest)] text-[var(--lm-on-surface)] placeholder:text-[color-mix(in_srgb,var(--lm-on-surface-variant)_50%,transparent)] focus:border-[var(--lm-primary)] focus:ring-[color-mix(in_srgb,var(--lm-primary)_20%,transparent)]"
        categories={navCategories.length > 0 && !searchResults ? navCategories : undefined}
        activeCategoryKey={null}
        onSelectCategory={(cat) => {
          const found = resolveNavNodeFromRailCategory(categories, cat);
          if (found) onSelectCategory(found);
        }}
        activeChipClassName="bg-[var(--lm-primary)] text-white"
        inactiveChipClassName="bg-[var(--lm-surface-container)] text-[var(--lm-on-surface)] ring-1 ring-[var(--lm-outline-variant)]"
      />

      {searchResults ? (
        <section className="px-4 pt-4">
          <h3 className="lm-headline-md mb-3 text-[var(--lm-on-surface)]">
            Arama sonuçları ({searchResults.length})
          </h3>
          {searchResults.length > 0 ? (
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
          ) : (
            <p className="rounded-xl border border-[var(--lm-outline-variant)] bg-[var(--lm-surface-container)] p-8 text-center text-[var(--lm-on-surface-variant)]">
              Aramanızla eşleşen ürün bulunamadı.
            </p>
          )}
          <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-6 text-sm text-[var(--lm-on-surface-variant)]" />
        </section>
      ) : (
        <>
          <section className="px-4 pt-4">
            <h3 className="lm-headline-md mb-3 text-[var(--lm-on-surface)]">
              Kategorilere göz at
            </h3>
            {categories.length > 0 ? (
              <DenseCategoryGrid
                categories={categoryGridItems}
                onSelect={(item) => {
                  const cat = categories.find((c) => c.categoryId === item.id);
                  if (cat) onSelectCategory(cat);
                }}
                cardClassName="border-[var(--lm-outline-variant)] bg-[var(--lm-surface-container-low)]"
                titleClassName="text-[var(--lm-on-surface)]"
                metaClassName="text-[var(--lm-on-surface-variant)]"
              />
            ) : (
              <p className="rounded-xl border border-[var(--lm-outline-variant)] bg-[var(--lm-surface-container)] p-6 text-center text-[var(--lm-on-surface-variant)]">
                Henüz kategori yok.
              </p>
            )}
          </section>

          {(menu.phone || menu.address) && (
            <section className="mt-4 px-4">
              <div className="flex items-center gap-3 rounded-xl border border-[var(--lm-outline-variant)] bg-[var(--lm-surface-container-lowest)] p-4">
                <span className="material-symbols-outlined text-[var(--lm-primary)]">info</span>
                <div className="min-w-0">
                  <h4 className="lm-body-lg font-bold text-[var(--lm-on-surface)]">İletişim</h4>
                  <p className="text-xs text-[var(--lm-on-surface-variant)]">
                    {[menu.phone, menu.address].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
