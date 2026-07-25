"use client";

import { useMemo } from "react";

import type { MenuProductApiItem } from "@/lib/api";

import type { MenuTemplateProps } from "../types";
import {
  filterProductsByNavCategory,
  formatMenuPrice,
  resolveMenuNavCategories,
} from "../types";
import {
  MenuCategoryRail,
  MenuProductScrollSentinel,
  MenuSearchField,
  searchMenuProducts,
  useMenuTemplateNav,
  useRegisterChefOpenProduct,
} from "../shared";
import { DarkProductDetail } from "./ProductDetail";

export function DarkMenuTemplate({
  menu,
  products,
  categories = [],
  analytics,
}: MenuTemplateProps) {
  const navCategories = useMemo(
    () => resolveMenuNavCategories(categories, products),
    [categories, products],
  );

  const {
    searchQuery,
    setSearchQuery,
    activeCategory,
    activeCategoryKey,
    selectedProduct,
    isProductView,
    selectCategory,
    openProduct,
    goBack,
  } = useMenuTemplateNav({ navCategories, products, analytics });

  useRegisterChefOpenProduct(openProduct);

  const categoryProducts = useMemo(
    () => filterProductsByNavCategory(products, activeCategory, categories),
    [products, activeCategory, categories],
  );

  const visibleProducts = useMemo(
    () => searchMenuProducts(categoryProducts, searchQuery),
    [categoryProducts, searchQuery],
  );

  const globalResults = useMemo(
    () => (searchQuery.trim() ? searchMenuProducts(products, searchQuery) : null),
    [products, searchQuery],
  );

  if (isProductView && selectedProduct) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              className="text-sm text-neutral-400"
            >
              ← Geri
            </button>
            <p className="truncate text-sm text-neutral-400">{menu.businessName}</p>
          </div>
        </header>
        <DarkProductDetail product={selectedProduct} onBack={goBack} />
      </div>
    );
  }

  const listItems = globalResults ?? visibleProducts;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold">{menu.businessName}</h1>
          {menu.slogan ? (
            <p className="mt-2 text-base text-neutral-300">{menu.slogan}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-400">
            {menu.phone ? <span>{menu.phone}</span> : null}
            {menu.email ? <span>{menu.email}</span> : null}
            {menu.address ? <span>{menu.address}</span> : null}
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-3xl space-y-3">
          <MenuSearchField
            value={searchQuery}
            onChange={setSearchQuery}
            inputClassName="border-neutral-700 bg-neutral-900 text-neutral-100 placeholder:text-neutral-500 focus:border-emerald-500/50"
          />
          <MenuCategoryRail
            categories={navCategories}
            activeKey={activeCategoryKey}
            onSelect={selectCategory}
            activeChipClassName="bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
            inactiveChipClassName="bg-neutral-900 text-neutral-300 ring-1 ring-neutral-800 hover:bg-neutral-800"
          />
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {globalResults ? (
          <p className="mb-4 text-sm text-neutral-500">
            “{searchQuery.trim()}” için {globalResults.length} sonuç
          </p>
        ) : activeCategory ? (
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            {activeCategory.name}
          </h2>
        ) : null}

        {listItems.length > 0 ? (
          <div className="space-y-3">
            {listItems.map((item) => (
              <DarkProductCard
                key={item.productId}
                item={item}
                onOpen={() => openProduct(item)}
              />
            ))}
            <MenuProductScrollSentinel />
          </div>
        ) : (
          <p className="text-center text-sm text-neutral-500">
            {searchQuery.trim()
              ? "Aramanızla eşleşen ürün bulunamadı."
              : "Bu kategoride henüz ürün yok."}
          </p>
        )}
        {listItems.length === 0 ? <MenuProductScrollSentinel /> : null}
      </main>
    </div>
  );
}

function DarkProductCard({
  item,
  onOpen,
}: {
  item: MenuProductApiItem;
  onOpen: () => void;
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      className="cursor-pointer rounded-xl bg-neutral-900 p-4 ring-1 ring-neutral-800 transition hover:ring-neutral-700"
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="flex gap-4">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-16 w-16 rounded-lg object-cover"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-3">
            <h3 className="font-medium">{item.name}</h3>
            <span className="shrink-0 text-emerald-400">
              {formatMenuPrice(item.price, item.currency)}
            </span>
          </div>
          {!item.available ? (
            <span className="mt-1 inline-block text-xs uppercase text-neutral-500">
              Tükendi
            </span>
          ) : null}
          {item.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-neutral-400">
              {item.description}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
