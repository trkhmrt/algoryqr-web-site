import type { RefObject } from "react";

import type { MenuCategoryApiItem, MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import { findCategoryById, flattenNavCategories } from "../types";
import { MenuCategoryRail, MenuProductScrollSentinel, searchMenuProducts } from "../shared";
import { countProductsForCategory } from "./category-utils";
import { LumiereProductCard } from "./ProductCard";
import { LUMIERE_HERO_IMAGE, lumiereCategoryImage } from "./styles";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  categories: MenuCategoryApiItem[];
  products: MenuProductApiItem[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelectCategory: (category: MenuCategoryApiItem) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
  infoRef: RefObject<HTMLDivElement | null>;
};

export function LumiereHomeView({
  menu,
  categories,
  products,
  searchValue,
  onSearchChange,
  onSelectCategory,
  onOpenProduct,
  infoRef,
}: HomeViewProps) {
  const slogan =
    menu.slogan?.trim() ||
    "Mevsimlik lezzetlerden oluşan özenle seçilmiş mutfak deneyimi.";

  const navCategories = flattenNavCategories(categories);
  const searchResults = searchValue.trim()
    ? searchMenuProducts(products, searchValue)
    : null;

  return (
    <div>
      <section className="relative h-[397px] w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={LUMIERE_HERO_IMAGE}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10 p-[var(--lm-margin)]">
          <span className="lm-badge mb-1 inline-block rounded px-2 py-1 text-[10px] uppercase tracking-widest">
            Bugünün seçkisi
          </span>
          <h2 className="lm-headline-lg mb-1 text-white">Lezzetin inceliği</h2>
          <p className="lm-body-sm max-w-[80%] text-white/80">{slogan}</p>
        </div>
      </section>

      <section className="relative z-20 -mt-6 px-[var(--lm-margin)]">
        <div
          className={`flex items-center gap-2 rounded-xl border bg-[var(--lm-surface-container-lowest)] p-1 shadow-lg transition-colors ${
            searchValue
              ? "border-[var(--lm-primary)]"
              : "border-[var(--lm-outline-variant)]"
          }`}
        >
          <div className="flex flex-1 items-center gap-1 px-2 py-4">
            <span className="material-symbols-outlined text-[20px] text-[var(--lm-on-surface-variant)]">
              search
            </span>
            <input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Menüde ürün ara…"
              className="lm-body-lg w-full border-none bg-transparent text-[var(--lm-on-surface)] outline-none placeholder:text-[color-mix(in_srgb,var(--lm-on-surface-variant)_50%,transparent)] focus:ring-0"
            />
            {searchValue ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="lm-body-sm px-2 text-[var(--lm-on-surface-variant)]"
              >
                Temizle
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {navCategories.length > 0 && !searchResults ? (
        <section className="mt-6 px-[var(--lm-margin)]">
          <MenuCategoryRail
            categories={navCategories}
            activeKey={null}
            onSelect={(cat) => {
              if (cat.categoryId == null) return;
              const found = findCategoryById(categories, cat.categoryId);
              if (found) onSelectCategory(found);
            }}
            activeChipClassName="bg-[var(--lm-primary)] text-white"
            inactiveChipClassName="bg-[var(--lm-surface-container)] text-[var(--lm-on-surface)] ring-1 ring-[var(--lm-outline-variant)]"
          />
        </section>
      ) : null}

      {searchResults ? (
        <section className="mt-8 px-[var(--lm-margin)]">
          <h3 className="lm-headline-md mb-4 text-[var(--lm-on-surface)]">
            Arama sonuçları ({searchResults.length})
          </h3>
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {searchResults.map((item) => (
                <LumiereProductCard
                  key={item.productId}
                  item={item}
                  onOpen={onOpenProduct}
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
          <section className="mt-10 px-[var(--lm-margin)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="lm-headline-md text-[var(--lm-on-surface)]">
                Kategorilere göz at
              </h3>
            </div>
            {categories.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {categories.map((category, index) => {
                  const count = countProductsForCategory(products, category);
                  return (
                    <button
                      key={category.categoryId}
                      type="button"
                      onClick={() => onSelectCategory(category)}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-[var(--lm-outline-variant)] bg-[var(--lm-surface-container-low)] transition-all hover:border-[color-mix(in_srgb,var(--lm-primary)_30%,transparent)] active:scale-[0.98]"
                    >
                      <img
                        src={lumiereCategoryImage(index)}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 p-4 text-left">
                        <p className="lm-headline-md text-white">{category.name}</p>
                        <p className="text-[12px] text-white/60">
                          {count} {count === 1 ? "ürün" : "ürün"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-[var(--lm-outline-variant)] bg-[var(--lm-surface-container)] p-6 text-center text-[var(--lm-on-surface-variant)]">
                Henüz kategori yok.
              </p>
            )}
          </section>

          <section className="mt-10 space-y-4 px-[var(--lm-margin)]">
            <div
              ref={infoRef}
              className="flex items-center justify-between rounded-xl border border-[var(--lm-outline-variant)] bg-[var(--lm-surface-container-lowest)] p-6"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--lm-secondary-container)] text-[var(--lm-on-secondary-container)]">
                  <span className="material-symbols-outlined">info</span>
                </div>
                <div>
                  <h4 className="lm-body-lg font-bold text-[var(--lm-on-surface)]">
                    İletişim
                  </h4>
                  <p className="text-[12px] text-[var(--lm-on-surface-variant)]">
                    {menu.phone || menu.address
                      ? [menu.phone, menu.address].filter(Boolean).join(" · ")
                      : "İşletme bilgileri"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
