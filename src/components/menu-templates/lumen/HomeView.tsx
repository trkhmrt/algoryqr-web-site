"use client";

import { useMemo } from "react";
import { Search, MapPin, Phone, ChevronRight } from "lucide-react";

import type { MenuCategoryApiItem, MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import { formatMenuPrice } from "../types";
import { MenuProductScrollSentinel, searchMenuProducts } from "../shared";
import {
  categoryEmojiFor,
  countProductsForCategory,
  popularProducts,
} from "./category-utils";
import { ItemRow } from "./ItemRow";
import { LUMEN_HERO_IMAGE } from "./styles";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  categories: MenuCategoryApiItem[];
  products: MenuProductApiItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectCategory: (category: MenuCategoryApiItem) => void;
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

  return (
    <div className="min-h-screen">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={LUMEN_HERO_IMAGE}
            alt=""
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[color-mix(in_oklch,var(--ln-bg)_40%,transparent)] via-[color-mix(in_oklch,var(--ln-bg)_70%,transparent)] to-[var(--ln-bg)]" />
        </div>
        <div className="relative mx-auto max-w-2xl px-6 pb-10 pt-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-bg)_50%,transparent)] px-3 py-1 text-[11px] uppercase tracking-[0.25em] ln-muted backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full ln-gold-bg" />
            Hoş geldiniz
          </div>
          <h1 className="font-display text-6xl font-semibold leading-none tracking-tight">
            <span className="text-gradient-gold">{menu.businessName}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm ln-muted">{slogan}</p>
          {(menu.phone || menu.address) && (
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs ln-muted">
              {menu.address ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 ln-gold" /> {menu.address}
                </span>
              ) : null}
              {menu.phone ? (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 ln-gold" /> {menu.phone}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </header>

      <div className="sticky top-0 z-30 border-b border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-bg)_85%,transparent)] backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-6 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ln-muted" />
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Yemek, malzeme veya kategori ara..."
              className="w-full rounded-full border border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-card)_70%,transparent)] py-3 pl-11 pr-4 text-sm ln-fg placeholder:text-[var(--ln-muted)] focus:border-[color-mix(in_oklch,var(--ln-gold)_60%,transparent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_oklch,var(--ln-gold)_20%,transparent)]"
            />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-6 pb-24 pt-8">
        {searchQuery.trim() ? (
          <section>
            <h2 className="mb-4 font-display text-xl font-semibold ln-fg">
              “{searchQuery}” için sonuçlar
            </h2>
            {searchResults.length === 0 ? (
              <p className="py-16 text-center text-sm ln-muted">Sonuç bulunamadı.</p>
            ) : (
              <div className="space-y-3">
                {searchResults.map((item) => (
                  <ItemRow key={item.productId} item={item} onOpen={onOpenProduct} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {popular.length > 0 ? (
              <section className="mb-10">
                <div className="mb-4 flex items-baseline justify-between">
                  <h2 className="font-display text-xl font-semibold ln-fg">
                    Öne çıkanlar
                  </h2>
                  <span className="text-[11px] uppercase tracking-widest ln-muted">
                    Şef seçimi
                  </span>
                </div>
                <div className="scrollbar-none -mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2">
                  {popular.map((item) => {
                    const price = formatMenuPrice(item.price, item.currency);
                    const kcal = item.nutrition?.energyKcal;
                    const protein = item.nutrition?.protein;
                    return (
                      <button
                        key={item.productId}
                        type="button"
                        onClick={() => onOpenProduct(item)}
                        className="group relative w-56 shrink-0 snap-start overflow-hidden rounded-2xl border border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-card)_60%,transparent)] text-left"
                      >
                        <div className="relative h-40 w-full overflow-hidden bg-[var(--ln-card)]">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                              loading="lazy"
                            />
                          ) : null}
                          <div className="absolute inset-0 bg-gradient-to-t from-[var(--ln-card)] via-transparent to-transparent" />
                          {price ? (
                            <span className="absolute right-2 top-2 rounded-full bg-[color-mix(in_oklch,var(--ln-gold)_90%,transparent)] px-2 py-0.5 text-[10px] font-medium text-[var(--ln-primary-fg)]">
                              {price}
                            </span>
                          ) : null}
                        </div>
                        <div className="p-3">
                          <p className="truncate font-display text-sm font-semibold ln-fg">
                            {item.name}
                          </p>
                          {kcal != null && kcal !== "" ? (
                            <p className="mt-0.5 text-[10px] uppercase tracking-widest ln-muted">
                              {kcal} kcal
                              {protein != null && protein !== ""
                                ? ` · ${protein}g protein`
                                : ""}
                            </p>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section>
              <h2 className="mb-4 font-display text-xl font-semibold ln-fg">
                Kategoriler
              </h2>
              {categories.length > 0 ? (
                <div className="space-y-3">
                  {categories.map((cat, index) => {
                    const subs = cat.children ?? [];
                    const count = countProductsForCategory(products, cat);
                    return (
                      <div
                        key={cat.categoryId}
                        className="overflow-hidden rounded-2xl border border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-card)_50%,transparent)]"
                      >
                        <button
                          type="button"
                          onClick={() => onSelectCategory(cat)}
                          className="group flex w-full items-center justify-between px-4 py-4 text-left transition hover:bg-[var(--ln-card)]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-[color-mix(in_oklch,var(--ln-gold)_15%,transparent)] font-display text-lg ln-gold">
                              {categoryEmojiFor(cat, categories) ||
                                lumenEmojiFallback(index)}
                            </span>
                            <div>
                              <p className="font-display text-lg font-semibold ln-fg">
                                {cat.name}
                              </p>
                              <p className="text-[11px] uppercase tracking-widest ln-muted">
                                {count} tabak
                                {subs.length > 0
                                  ? ` · ${subs.length} alt kategori`
                                  : ""}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 ln-muted transition group-hover:translate-x-0.5 group-hover:text-[var(--ln-gold)]" />
                        </button>
                        {subs.length > 0 ? (
                          <div className="border-t border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-bg)_30%,transparent)] px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {subs.map((sub) => (
                                <button
                                  key={sub.categoryId}
                                  type="button"
                                  onClick={() => onSelectCategory(sub)}
                                  className="rounded-full border border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-card)_60%,transparent)] px-3 py-1 text-xs ln-muted transition hover:border-[color-mix(in_oklch,var(--ln-gold)_50%,transparent)] hover:text-[var(--ln-fg)]"
                                >
                                  {sub.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
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

      <footer className="border-t border-[var(--ln-border)] py-8 text-center">
        <p className="font-display text-xl text-gradient-gold">{menu.businessName}</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.3em] ln-muted">
          Afiyet olsun
        </p>
      </footer>
    </div>
  );
}

function lumenEmojiFallback(index: number) {
  const emojis = ["◐", "◆", "◇", "◈", "❋", "✦", "◉"];
  return emojis[index % emojis.length];
}
