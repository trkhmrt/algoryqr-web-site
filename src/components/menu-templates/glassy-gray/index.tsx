"use client";

import { useMemo, useState } from "react";

import type { MenuCategoryApiItem, MenuProductApiItem } from "@/lib/api";
import type { MenuTemplateProps } from "../types";
import {
  MenuProductScrollSentinel,
  resolveSelectedProduct,
  searchMenuProducts,
  useRegisterChefOpenProduct,
} from "../shared";
import {
  type GlassyView,
  filterProductsForCategory,
  findCategoryById,
  firstRootCategory,
  popularProducts,
} from "./category-utils";
import { GlassyGrayCategoryView } from "./CategoryView";
import { GlassyGrayShell } from "./GlassyGrayShell";
import { GlassyGrayHomeView } from "./HomeView";
import { GlassyGrayProductCard } from "./ProductCard";
import { GlassyGrayProductDetailView } from "./ProductDetailView";

export function GlassyGrayMenuTemplate({
  menu,
  products,
  categories = [],
  analytics,
}: MenuTemplateProps) {
  const [view, setView] = useState<GlassyView>({ type: "home" });
  const [searchValue, setSearchValue] = useState("");
  const [pinnedProduct, setPinnedProduct] = useState<MenuProductApiItem | null>(
    null,
  );

  const activeCategoryId =
    view.type === "category"
      ? view.categoryId
      : view.type === "product"
        ? view.categoryId
        : null;

  const activeCategory =
    activeCategoryId != null ? findCategoryById(categories, activeCategoryId) : null;

  const categoryProducts = useMemo(
    () => filterProductsForCategory(products, activeCategory),
    [products, activeCategory],
  );

  const popular = useMemo(() => popularProducts(products), [products]);

  const globalResults = useMemo(
    () => (searchValue.trim() ? searchMenuProducts(products, searchValue) : null),
    [products, searchValue],
  );

  const selectedProduct =
    view.type === "product"
      ? resolveSelectedProduct(products, view.productId, pinnedProduct)
      : null;

  const goHome = () => {
    setSearchValue("");
    setPinnedProduct(null);
    setView({ type: "home" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goMenu = () => {
    const first = firstRootCategory(categories);
    if (first) {
      setView({ type: "category", categoryId: first.categoryId });
      analytics?.trackCategoryView(first.categoryId);
    } else {
      setView({ type: "home" });
    }
    setSearchValue("");
    setPinnedProduct(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectCategory = (category: MenuCategoryApiItem) => {
    setSearchValue("");
    setPinnedProduct(null);
    setView({ type: "category", categoryId: category.categoryId });
    analytics?.trackCategoryView(category.categoryId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openProduct = (product: MenuProductApiItem) => {
    const categoryId = product.categoryId ?? activeCategoryId;
    setPinnedProduct(product);
    setView({
      type: "product",
      productId: product.productId,
      categoryId,
    });
    analytics?.trackProductView(product.productId, categoryId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useRegisterChefOpenProduct(openProduct);

  const backFromProduct = () => {
    setPinnedProduct(null);
    if (view.type === "product" && view.categoryId != null) {
      setView({ type: "category", categoryId: view.categoryId });
    } else {
      goMenu();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeNav: "home" | "menu" = view.type === "home" ? "home" : "menu";
  const showSearch = view.type === "category" || view.type === "home";

  return (
    <GlassyGrayShell
      menu={menu}
      categories={categories}
      activeNav={activeNav}
      activeCategoryId={activeCategoryId}
      showSearch={showSearch}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      onHome={goHome}
      onMenu={goMenu}
      onSelectCategory={selectCategory}
      onBack={view.type === "product" ? backFromProduct : undefined}
      showCategoryRail={view.type === "category"}
    >
      {view.type === "home" && globalResults ? (
        <section>
          <h2 className="gg-display mb-4 text-2xl font-bold text-white">
            Arama sonuçları
          </h2>
          <p className="gg-muted mb-6 text-sm">
            “{searchValue.trim()}” için {globalResults.length} sonuç
          </p>
          {globalResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {globalResults.map((item) => (
                <GlassyGrayProductCard
                  key={item.productId}
                  item={item}
                  onOpen={openProduct}
                />
              ))}
            </div>
          ) : (
            <p className="gg-glass-heavy gg-muted rounded-3xl p-8 text-center">
              Aramanızla eşleşen ürün bulunamadı.
            </p>
          )}
          <MenuProductScrollSentinel className="gg-muted flex min-h-8 items-center justify-center py-6 text-sm" />
        </section>
      ) : null}

      {view.type === "home" && !globalResults ? (
        <GlassyGrayHomeView
          menu={menu}
          popular={popular}
          onSeeMenu={goMenu}
          onOpenProduct={openProduct}
        />
      ) : null}

      {view.type === "category" && activeCategory ? (
        <GlassyGrayCategoryView
          category={activeCategory}
          products={categoryProducts}
          searchQuery={searchValue}
          onOpenProduct={openProduct}
        />
      ) : null}

      {view.type === "category" && !activeCategory ? (
        <p className="gg-glass-heavy gg-muted rounded-3xl p-8 text-center">
          Kategori bulunamadı.
        </p>
      ) : null}

      {view.type === "product" && selectedProduct ? (
        <GlassyGrayProductDetailView product={selectedProduct} onBack={backFromProduct} />
      ) : null}

      {view.type === "product" && !selectedProduct ? (
        <p className="gg-glass-heavy gg-muted rounded-3xl p-8 text-center">
          Ürün bulunamadı.
        </p>
      ) : null}
    </GlassyGrayShell>
  );
}
