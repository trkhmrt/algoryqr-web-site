"use client";

import { useMemo, useRef, useState } from "react";

import type { MenuCategoryApiItem, MenuProductApiItem } from "@/lib/api";
import type { MenuTemplateProps } from "../types";
import { resolveSelectedProduct, useRegisterChefOpenProduct } from "../shared";
import {
  type LumiereView,
  filterProductsForCategory,
  findCategoryById,
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
  const [pinnedProduct, setPinnedProduct] = useState<MenuProductApiItem | null>(
    null,
  );
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
      ? resolveSelectedProduct(products, view.productId, pinnedProduct)
      : null;

  const goHome = () => {
    setSearchValue("");
    setPinnedProduct(null);
    setView({ type: "home" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectCategory = (category: MenuCategoryApiItem) => {
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

  const backFromNested = () => {
    setPinnedProduct(null);
    if (view.type === "product" && view.categoryId != null) {
      setView({ type: "category", categoryId: view.categoryId });
    } else if (view.type === "category") {
      goHome();
    } else {
      goHome();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const topVariant = view.type === "home" ? "home" : "detail";

  return (
    <LumiereShell
      menu={menu}
      topVariant={topVariant}
      onBack={view.type !== "home" ? backFromNested : undefined}
      onHome={goHome}
    >
      {view.type === "home" ? (
        <LumiereHomeView
          menu={menu}
          categories={displayCategories}
          products={products}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSelectCategory={(category) => {
            setSearchValue("");
            selectCategory(category);
          }}
          onOpenProduct={openProduct}
          infoRef={infoRef}
        />
      ) : null}

      {view.type === "category" && activeCategory ? (
        <LumiereCategoryView
          category={activeCategory}
          categories={displayCategories}
          products={categoryProducts}
          searchQuery={searchValue}
          onSearchChange={setSearchValue}
          categoryIndex={categoryIndex}
          onSelectCategory={(category) => {
            setSearchValue("");
            selectCategory(category);
          }}
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
