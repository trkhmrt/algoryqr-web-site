"use client";

import { useMemo } from "react";

import type { MenuTemplateProps } from "../types";
import {
  filterProductsByNavCategory,
  resolveMenuNavCategories,
} from "../types";
import {
  DenseProductRow,
  DenseStickyToolbar,
  MenuBrandLogo,
  MenuProductScrollSentinel,
  searchMenuProducts,
  useMenuTemplateNav,
  useRegisterChefOpenProduct,
} from "../shared";
import { DarkShell } from "./DarkShell";
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
    () => filterProductsByNavCategory(products, activeCategory),
    [products, activeCategory],
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
      <DarkShell>
        <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/95 px-4 py-2.5 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
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
      </DarkShell>
    );
  }

  const listItems = globalResults ?? visibleProducts;

  const rowProps = {
    className: "border-neutral-800",
    imageClassName: "bg-neutral-900",
    titleClassName: "text-neutral-100",
    priceClassName: "text-emerald-400",
    descriptionClassName: "text-neutral-400",
    chipClassName: "bg-neutral-800 text-neutral-400",
    accentChipClassName: "bg-emerald-500/20 text-emerald-300",
    destructiveChipClassName: "bg-red-500/20 text-red-300",
    imagePlaceholderClassName: "text-neutral-600",
  };

  return (
    <DarkShell>
      <header className="border-b border-neutral-800 px-4 py-5">
        <div className="mb-3">
          <MenuBrandLogo logoUrl={menu.logoUrl} businessName={menu.businessName} size={56} />
        </div>
        <h1 className="text-2xl font-bold">{menu.businessName}</h1>
        {menu.slogan ? (
          <p className="mt-1.5 line-clamp-2 text-sm text-neutral-300">{menu.slogan}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-400">
          {menu.phone ? <span>{menu.phone}</span> : null}
          {menu.email ? <span>{menu.email}</span> : null}
          {menu.address ? <span className="line-clamp-1">{menu.address}</span> : null}
        </div>
      </header>

      <DenseStickyToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Ürün ara…"
        className="border-b border-neutral-800 bg-neutral-950/95"
        searchClassName="border-neutral-700 bg-neutral-900 text-neutral-100 placeholder:text-neutral-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
        searchIconClassName="text-neutral-500"
        categories={navCategories}
        activeCategoryKey={activeCategoryKey}
        onSelectCategory={selectCategory}
        activeChipClassName="bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
        inactiveChipClassName="bg-neutral-900 text-neutral-300 ring-1 ring-neutral-800"
      />

      <main className="px-4 py-4 pb-20">
        {globalResults ? (
          <p className="mb-3 text-sm text-neutral-500">
            “{searchQuery.trim()}” için {globalResults.length} sonuç
          </p>
        ) : activeCategory ? (
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            {activeCategory.name}
          </h2>
        ) : null}

        {listItems.length > 0 ? (
          <div>
            {listItems.map((item) => (
              <DenseProductRow
                key={item.productId}
                item={item}
                onOpen={openProduct}
                {...rowProps}
              />
            ))}
            <MenuProductScrollSentinel />
          </div>
        ) : (
          <>
            <p className="py-12 text-center text-sm text-neutral-500">
              {searchQuery.trim()
                ? "Aramanızla eşleşen ürün bulunamadı."
                : "Bu kategoride henüz ürün yok."}
            </p>
            <MenuProductScrollSentinel />
          </>
        )}
      </main>
    </DarkShell>
  );
}
