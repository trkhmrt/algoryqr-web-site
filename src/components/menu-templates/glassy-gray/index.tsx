"use client";

import { useMemo, useState } from "react";

import type { MenuCategoryApiItem, MenuProductApiItem } from "@/lib/api";
import type { MenuTemplateProps } from "../types";
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
import { GlassyGrayProductDetailView } from "./ProductDetailView";

export function GlassyGrayMenuTemplate({ menu, products, categories = [] }: MenuTemplateProps) {
  const [view, setView] = useState<GlassyView>({ type: "home" });
  const [searchValue, setSearchValue] = useState("");

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

  const selectedProduct =
    view.type === "product"
      ? products.find((p) => p.productId === view.productId) ?? null
      : null;

  const goHome = () => {
    setSearchValue("");
    setView({ type: "home" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goMenu = () => {
    const first = firstRootCategory(categories);
    if (first) {
      setView({ type: "category", categoryId: first.categoryId });
    } else {
      setView({ type: "home" });
    }
    setSearchValue("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectCategory = (category: MenuCategoryApiItem) => {
    setSearchValue("");
    setView({ type: "category", categoryId: category.categoryId });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openProduct = (product: MenuProductApiItem) => {
    setView({
      type: "product",
      productId: product.productId,
      categoryId: product.categoryId ?? activeCategoryId,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backFromProduct = () => {
    if (view.type === "product" && view.categoryId != null) {
      setView({ type: "category", categoryId: view.categoryId });
    } else {
      goMenu();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeNav: "home" | "menu" = view.type === "home" ? "home" : "menu";

  return (
    <GlassyGrayShell
      menu={menu}
      categories={categories}
      activeNav={activeNav}
      activeCategoryId={activeCategoryId}
      showSearch={view.type === "category"}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      onHome={goHome}
      onMenu={goMenu}
      onSelectCategory={selectCategory}
      onBack={view.type === "product" ? backFromProduct : undefined}
    >
      {view.type === "home" ? (
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
          Kategori bulunamadi.
        </p>
      ) : null}

      {view.type === "product" && selectedProduct ? (
        <GlassyGrayProductDetailView product={selectedProduct} onBack={backFromProduct} />
      ) : null}

      {view.type === "product" && !selectedProduct ? (
        <p className="gg-glass-heavy gg-muted rounded-3xl p-8 text-center">
          Urun bulunamadi.
        </p>
      ) : null}
    </GlassyGrayShell>
  );
}
