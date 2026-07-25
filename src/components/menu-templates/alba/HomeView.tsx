"use client";

import { useMemo } from "react";
import { Search, MapPin, Phone, ArrowUpRight } from "lucide-react";

import type { MenuCategoryApiItem, MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import { formatMenuPrice } from "../types";
import { MenuProductScrollSentinel, searchMenuProducts } from "../shared";
import {
  categoryMarkFor,
  countProductsForCategory,
  popularProducts,
} from "./category-utils";
import { ItemRow } from "./ItemRow";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  categories: MenuCategoryApiItem[];
  products: MenuProductApiItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectCategory: (category: MenuCategoryApiItem) => void;
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

  return (
    <div className="min-h-screen">
      <header className="relative overflow-hidden">
        <div className="mx-auto max-w-2xl px-6 pb-8 pt-16 text-center">
          <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.28em] ab-muted">
            Dijital menü
          </p>
          <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight ab-fg sm:text-6xl">
            {menu.businessName}
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed ab-muted">
            {slogan}
          </p>
          {(menu.phone || menu.address) && (
            <div className="mt-7 flex flex-wrap justify-center gap-5 text-xs ab-muted">
              {menu.address ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 ab-accent" />
                  {menu.address}
                </span>
              ) : null}
              {menu.phone ? (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 ab-accent" />
                  {menu.phone}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </header>

      <div className="sticky top-0 z-30 border-b border-[var(--ab-border)] bg-[color-mix(in_srgb,var(--ab-bg)_82%,transparent)] backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-6 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ab-muted" />
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Ürün veya kategori ara…"
              className="w-full rounded-2xl border border-[var(--ab-border)] bg-[var(--ab-surface)] py-3 pl-11 pr-4 text-sm ab-fg shadow-[0_1px_2px_rgba(21,32,43,0.04)] placeholder:text-[var(--ab-muted)] focus:border-[color-mix(in_srgb,var(--ab-accent)_40%,transparent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--ab-accent)_15%,transparent)]"
            />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-6 pb-24 pt-8">
        {searchQuery.trim() ? (
          <section>
            <h2 className="mb-4 font-display text-xl font-semibold ab-fg">
              “{searchQuery}” sonuçları
            </h2>
            {searchResults.length === 0 ? (
              <p className="py-16 text-center text-sm ab-muted">Sonuç bulunamadı.</p>
            ) : (
              <div>
                {searchResults.map((item) => (
                  <ItemRow key={item.productId} item={item} onOpen={onOpenProduct} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {popular.length > 0 ? (
              <section className="mb-12">
                <div className="mb-5 flex items-baseline justify-between">
                  <h2 className="font-display text-xl font-semibold ab-fg">
                    Öne çıkanlar
                  </h2>
                  <span className="text-[11px] uppercase tracking-[0.2em] ab-muted">
                    Seçki
                  </span>
                </div>
                <div className="scrollbar-none -mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-1">
                  {popular.map((item) => {
                    const price = formatMenuPrice(item.price, item.currency);
                    return (
                      <button
                        key={item.productId}
                        type="button"
                        onClick={() => onOpenProduct(item)}
                        className="group w-52 shrink-0 snap-start text-left"
                      >
                        <div className="relative h-36 w-full overflow-hidden rounded-2xl bg-[var(--ab-bg-soft)]">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-3xl ab-accent">
                              ◇
                            </div>
                          )}
                        </div>
                        <div className="mt-3">
                          <p className="truncate font-display text-base font-semibold ab-fg">
                            {item.name}
                          </p>
                          {price ? (
                            <p className="mt-0.5 text-sm ab-accent">{price}</p>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section>
              <h2 className="mb-5 font-display text-xl font-semibold ab-fg">
                Kategoriler
              </h2>
              {categories.length > 0 ? (
                <div className="space-y-2">
                  {categories.map((cat, index) => {
                    const subs = cat.children ?? [];
                    const count = countProductsForCategory(products, cat);
                    return (
                      <div key={cat.categoryId}>
                        <button
                          type="button"
                          onClick={() => onSelectCategory(cat)}
                          className="group flex w-full items-center justify-between rounded-2xl px-3 py-4 text-left transition hover:bg-[var(--ab-surface)]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--ab-accent-soft)] font-display text-lg ab-accent">
                              {categoryMarkFor(cat, categories) ||
                                albaMarkFallback(index)}
                            </span>
                            <div>
                              <p className="font-display text-lg font-semibold ab-fg">
                                {cat.name}
                              </p>
                              <p className="text-[11px] uppercase tracking-[0.16em] ab-muted">
                                {count} ürün
                                {subs.length > 0
                                  ? ` · ${subs.length} alt kategori`
                                  : ""}
                              </p>
                            </div>
                          </div>
                          <ArrowUpRight className="h-4 w-4 ab-muted transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--ab-accent)]" />
                        </button>
                        {subs.length > 0 ? (
                          <div className="mb-2 ml-14 flex flex-wrap gap-2 pb-2">
                            {subs.map((sub) => (
                              <button
                                key={sub.categoryId}
                                type="button"
                                onClick={() => onSelectCategory(sub)}
                                className="rounded-full border border-[var(--ab-border)] bg-[var(--ab-surface)] px-3 py-1 text-xs ab-muted transition hover:border-[color-mix(in_srgb,var(--ab-accent)_35%,transparent)] hover:text-[var(--ab-fg)]"
                              >
                                {sub.name}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
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

      <footer className="border-t border-[var(--ab-border)] py-10 text-center">
        <p className="font-display text-2xl font-semibold ab-fg">
          {menu.businessName}
        </p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.28em] ab-muted">
          Afiyet olsun
        </p>
      </footer>
    </div>
  );
}

function albaMarkFallback(index: number) {
  const marks = ["◇", "○", "△", "□", "✦", "◎", "◌"];
  return marks[index % marks.length];
}
