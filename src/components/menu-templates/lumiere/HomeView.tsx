import type { RefObject } from "react";

import type { MenuCategoryApiItem, MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import { countProductsForCategory } from "./category-utils";
import { LUMIERE_HERO_IMAGE, lumiereCategoryImage } from "./styles";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  categories: MenuCategoryApiItem[];
  products: MenuProductApiItem[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSelectCategory: (category: MenuCategoryApiItem) => void;
  onSpecials: () => void;
  infoRef: RefObject<HTMLDivElement | null>;
};

export function LumiereHomeView({
  menu,
  categories,
  products,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onSelectCategory,
  onSpecials,
  infoRef,
}: HomeViewProps) {
  const slogan =
    menu.slogan?.trim() ||
    "Discover our seasonal curation of avant-garde culinary experiences.";

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
            Featured Today
          </span>
          <h2 className="lm-headline-lg mb-1 text-white">Taste the Art of Precision</h2>
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
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearchSubmit();
              }}
              placeholder="Search our menu..."
              className="lm-body-lg w-full border-none bg-transparent text-[var(--lm-on-surface)] outline-none placeholder:text-[color-mix(in_srgb,var(--lm-on-surface-variant)_50%,transparent)] focus:ring-0"
            />
          </div>
          <button
            type="button"
            onClick={onSearchSubmit}
            className="lm-cta lm-label-caps rounded-lg px-4 py-2 transition-opacity hover:opacity-90"
          >
            SEARCH
          </button>
        </div>
      </section>

      <section className="mt-10 px-[var(--lm-margin)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="lm-headline-md text-[var(--lm-on-surface)]">Browse by Category</h3>
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
                      {count} {count === 1 ? "item" : "items"}
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
        <button
          type="button"
          onClick={onSpecials}
          className="flex w-full items-center justify-between rounded-xl border border-[var(--lm-outline-variant)] bg-[var(--lm-surface-container)] p-6 text-left transition-opacity hover:opacity-90"
        >
          <div>
            <h4 className="lm-headline-md text-[var(--lm-on-surface)]">Chef&apos;s Selection</h4>
            <p className="lm-body-sm text-[var(--lm-on-surface-variant)]">
              Weekly curated tasting menu details
            </p>
          </div>
          <span className="material-symbols-outlined lm-primary">auto_awesome</span>
        </button>

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
                Allergy Information
              </h4>
              <p className="text-[12px] text-[var(--lm-on-surface-variant)]">
                {menu.phone || menu.address
                  ? [menu.phone, menu.address].filter(Boolean).join(" · ")
                  : "View our nutritional guidelines"}
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-[color-mix(in_srgb,var(--lm-on-surface-variant)_30%,transparent)]">
            chevron_right
          </span>
        </div>
      </section>
    </div>
  );
}
