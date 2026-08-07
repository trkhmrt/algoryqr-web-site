"use client";

import { useMemo, useState } from "react";

import type { MenuProductApiItem } from "@/lib/api";
import type { MenuTemplateProps, TaxonomyNavNode } from "../types";
import {
  findCategoryById,
  resolveProductNavCategory,
  taxonomyAsNavTree,
  trackIdForNavNode,
} from "../types";
import { resolveSelectedProduct, useRegisterChefOpenProduct } from "../shared";
import type { AlbaView } from "./category-utils";
import { AlbaCategoryView } from "./CategoryView";
import { AlbaHomeView } from "./HomeView";
import { AlbaProductDetailView } from "./ProductDetailView";
import { AlbaShell } from "./AlbaShell";

export function AlbaMenuTemplate({
  menu,
  products,
  categories = [],
  analytics,
}: MenuTemplateProps) {
  const [view, setView] = useState<AlbaView>({ type: "home" });
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedProduct, setPinnedProduct] = useState<MenuProductApiItem | null>(
    null,
  );

  const displayCategories = useMemo(
    () => taxonomyAsNavTree(categories),
    [categories],
  );

  const activeCategoryId =
    view.type === "category"
      ? view.categoryId
      : view.type === "product"
        ? view.categoryId
        : null;

  const activeCategory =
    activeCategoryId != null
      ? findCategoryById(displayCategories, activeCategoryId)
      : null;

  const selectedProduct = useMemo(() => {
    if (view.type !== "product") return null;
    return resolveSelectedProduct(products, view.productId, pinnedProduct);
  }, [view, products, pinnedProduct]);

  const goHome = () => {
    setSearchQuery("");
    setPinnedProduct(null);
    setView({ type: "home" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectCategory = (category: TaxonomyNavNode) => {
    setSearchQuery("");
    setPinnedProduct(null);
    setView({ type: "category", categoryId: category.categoryId });
    analytics?.trackCategoryView(trackIdForNavNode(category));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openProduct = (product: MenuProductApiItem) => {
    const productCategory = resolveProductNavCategory(displayCategories, product);
    const categoryId = productCategory?.categoryId ?? activeCategoryId;
    setPinnedProduct(product);
    setView({
      type: "product",
      productId: product.productId,
      categoryId,
    });
    analytics?.trackProductView(
      product.productId,
      product.subCategoryId ?? product.mainCategoryId ?? null,
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useRegisterChefOpenProduct(openProduct);

  const backFromProduct = () => {
    setPinnedProduct(null);
    if (view.type === "product" && view.categoryId != null) {
      setView({ type: "category", categoryId: view.categoryId });
    } else {
      goHome();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backFromCategory = () => {
    goHome();
  };

  return (
    <AlbaShell>
      {view.type === "home" ? (
        <AlbaHomeView
          menu={menu}
          categories={displayCategories}
          products={products}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectCategory={selectCategory}
          onOpenProduct={openProduct}
        />
      ) : null}

      {view.type === "category" && activeCategory ? (
        <AlbaCategoryView
          category={activeCategory}
          categories={displayCategories}
          products={products}
          onHome={backFromCategory}
          onSelectCategory={selectCategory}
          onOpenProduct={openProduct}
        />
      ) : null}

      {view.type === "category" && !activeCategory ? (
        <div className="flex min-h-screen items-center justify-center px-6 text-center">
          <div>
            <p className="text-sm ab-muted">Kategori bulunamadı.</p>
            <button
              type="button"
              onClick={goHome}
              className="mt-4 text-sm ab-accent underline"
            >
              Menüye dön
            </button>
          </div>
        </div>
      ) : null}

      {view.type === "product" && selectedProduct ? (
        <AlbaProductDetailView
          product={selectedProduct}
          categories={displayCategories}
          onBack={backFromProduct}
          onHome={goHome}
          onSelectCategory={selectCategory}
        />
      ) : null}

      {view.type === "product" && !selectedProduct ? (
        <div className="flex min-h-screen items-center justify-center px-6 text-center">
          <div>
            <p className="text-sm ab-muted">Ürün bulunamadı.</p>
            <button
              type="button"
              onClick={goHome}
              className="mt-4 text-sm ab-accent underline"
            >
              Menüye dön
            </button>
          </div>
        </div>
      ) : null}
    </AlbaShell>
  );
}
