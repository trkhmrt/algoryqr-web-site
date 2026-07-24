"use client";

import { useMemo, useRef, useState } from "react";

import type { MenuCategoryApiItem, MenuProductApiItem } from "@/lib/api";
import type { MenuTemplateProps } from "../types";
import {
  type LumiereNavTab,
  type LumiereView,
  filterProductsForCategory,
  findCategoryById,
  firstRootCategory,
} from "./category-utils";
import { LumiereCategoryView } from "./CategoryView";
import { LumiereHomeView } from "./HomeView";
import { LumiereShell } from "./LumiereShell";
import { LumiereProductDetailView } from "./ProductDetailView";

export function LumiereMenuTemplate({
  menu,
  products,
  categories = [],
  analytics,
}: MenuTemplateProps) {
  const [view, setView] = useState<LumiereView>({ type: "home" });
  const [searchValue, setSearchValue] = useState("");
  const [activeNav, setActiveNav] = useState<LumiereNavTab>("menu");
  const infoRef = useRef<HTMLDivElement | null>(null);

  const displayCategories = categories;

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

  const categoryIndex = activeCategory
    ? Math.max(
        0,
        displayCategories.findIndex((c) => c.categoryId === activeCategory.categoryId),
      )
    : 0;

  const selectedProduct =
    view.type === "product"
      ? products.find((p) => p.productId === view.productId) ?? null
      : null;

  const goHome = () => {
    setSearchValue("");
    setActiveNav("menu");
    setView({ type: "home" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectCategory = (category: MenuCategoryApiItem) => {
    setActiveNav("menu");
    setView({ type: "category", categoryId: category.categoryId });
    analytics?.trackCategoryView(category.categoryId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openProduct = (product: MenuProductApiItem) => {
    const categoryId = product.categoryId ?? activeCategoryId;
    setActiveNav("menu");
    setView({
      type: "product",
      productId: product.productId,
      categoryId,
    });
    analytics?.trackProductView(product.productId, categoryId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backFromNested = () => {
    if (view.type === "product" && view.categoryId != null) {
      setView({ type: "category", categoryId: view.categoryId });
    } else if (view.type === "category") {
      goHome();
    } else {
      goHome();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goSearch = () => {
    const first = firstRootCategory(displayCategories);
    setActiveNav("search");
    if (first) {
      setView({ type: "category", categoryId: first.categoryId });
      analytics?.trackCategoryView(first.categoryId);
    } else {
      setView({ type: "home" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goSpecials = () => {
    setActiveNav("specials");
    setSearchValue("");
    setView({ type: "home" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goInfo = () => {
    setActiveNav("info");
    setView({ type: "home" });
    requestAnimationFrame(() => {
      infoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const onSearchSubmit = () => {
    const q = searchValue.trim().toLowerCase();
    if (!q) {
      goSearch();
      return;
    }
    const match = products.find(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false),
    );
    if (match?.categoryId != null) {
      setActiveNav("search");
      setView({ type: "category", categoryId: match.categoryId });
      analytics?.trackCategoryView(match.categoryId);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    goSearch();
  };

  const topVariant = view.type === "home" ? "home" : "detail";

  return (
    <LumiereShell
      menu={menu}
      activeNav={activeNav}
      topVariant={topVariant}
      onBack={view.type !== "home" ? backFromNested : undefined}
      onMenu={goHome}
      onSearch={goSearch}
      onSpecials={goSpecials}
      onInfo={goInfo}
    >
      {view.type === "home" ? (
        <LumiereHomeView
          menu={menu}
          categories={displayCategories}
          products={products}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSearchSubmit={onSearchSubmit}
          onSelectCategory={(category) => {
            setSearchValue("");
            selectCategory(category);
          }}
          onSpecials={goSpecials}
          infoRef={infoRef}
        />
      ) : null}

      {view.type === "category" && activeCategory ? (
        <LumiereCategoryView
          category={activeCategory}
          products={categoryProducts}
          searchQuery={searchValue}
          onSearchChange={setSearchValue}
          categoryIndex={categoryIndex}
          onOpenProduct={openProduct}
        />
      ) : null}

      {view.type === "category" && !activeCategory ? (
        <p className="m-[var(--lm-margin)] rounded-xl border border-[var(--lm-outline-variant)] bg-[var(--lm-surface-container)] p-8 text-center text-[var(--lm-on-surface-variant)]">
          Kategori bulunamadı.
        </p>
      ) : null}

      {view.type === "product" && selectedProduct ? (
        <LumiereProductDetailView product={selectedProduct} />
      ) : null}

      {view.type === "product" && !selectedProduct ? (
        <p className="m-[var(--lm-margin)] rounded-xl border border-[var(--lm-outline-variant)] bg-[var(--lm-surface-container)] p-8 text-center text-[var(--lm-on-surface-variant)]">
          Ürün bulunamadı.
        </p>
      ) : null}
    </LumiereShell>
  );
}
