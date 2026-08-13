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
import {
  resolveSelectedProduct,
  useMenuCategoryFeed,
  useMenuFeedback,
  useRegisterChefOpenProduct,
} from "../shared";
import type { TechGourmetView } from "./category-utils";
import { TechGourmetCategoryView } from "./CategoryView";
import { TechGourmetHomeView } from "./HomeView";
import { TechGourmetProductDetailView } from "./ProductDetailView";
import { TechGourmetShell } from "./Shell";

export function TechGourmetMenuTemplate({
  menu,
  products,
  categories = [],
  analytics,
}: MenuTemplateProps) {
  const [view, setView] = useState<TechGourmetView>({ type: "home" });
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedProduct, setPinnedProduct] = useState<MenuProductApiItem | null>(null);

  const feedback = useMenuFeedback(
    menu.menuId,
    menu.ratingAvg != null ? Number(menu.ratingAvg) : null,
    menu.ratingCount ?? 0,
  );

  const categoryFeed = useMenuCategoryFeed();
  const taxonomySource =
    categoryFeed.categories.length > 0 ? categoryFeed.categories : categories;
  const displayCategories = useMemo(() => taxonomyAsNavTree(taxonomySource), [taxonomySource]);

  const activeCategoryId =
    view.type === "category"
      ? view.categoryId
      : view.type === "product"
        ? view.categoryId
        : null;

  const activeCategory =
    activeCategoryId != null ? findCategoryById(displayCategories, activeCategoryId) : null;

  const selectedProduct = useMemo(() => {
    if (view.type !== "product") return null;
    return resolveSelectedProduct(products, view.productId, pinnedProduct);
  }, [view, products, pinnedProduct]);

  const goHome = () => {
    setSearchQuery("");
    setPinnedProduct(null);
    feedback.syncProductState(null);
    setView({ type: "home" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectCategory = (category: TaxonomyNavNode) => {
    setSearchQuery("");
    setPinnedProduct(null);
    feedback.syncProductState(null);
    setView({ type: "category", categoryId: category.categoryId });
    analytics?.trackCategoryView(trackIdForNavNode(category));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openProduct = (product: MenuProductApiItem) => {
    const productCategory = resolveProductNavCategory(displayCategories, product);
    const categoryId = productCategory?.categoryId ?? activeCategoryId;
    setPinnedProduct(product);
    feedback.syncProductState(product);
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

  useRegisterChefOpenProduct((product) => {
    openProduct(product);
  });

  const backFromProduct = () => {
    setPinnedProduct(null);
    feedback.syncProductState(null);
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
    <TechGourmetShell menu={menu}>
      {view.type === "home" ? (
        <TechGourmetHomeView
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
        <TechGourmetCategoryView
          category={activeCategory}
          categories={displayCategories}
          products={products}
          onHome={backFromCategory}
          onSelectCategory={selectCategory}
          onOpenProduct={openProduct}
        />
      ) : null}

      {view.type === "category" && !activeCategory ? (
        <div className="flex min-h-[60vh] items-center justify-center px-6 text-center">
          <div>
            <p
              className="text-sm uppercase tracking-widest"
              style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-fg-variant)" }}
            >
              KATEGORİ BULUNAMADI
            </p>
            <button
              type="button"
              onClick={goHome}
              className="mt-4 text-xs uppercase underline"
              style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-primary)" }}
            >
              Menüye dön
            </button>
          </div>
        </div>
      ) : null}

      {view.type === "product" && selectedProduct ? (
        <TechGourmetProductDetailView
          product={selectedProduct}
          categories={displayCategories}
          onBack={backFromProduct}
          onHome={goHome}
          onSelectCategory={selectCategory}
        />
      ) : null}

      {view.type === "product" && !selectedProduct ? (
        <div className="flex min-h-[60vh] items-center justify-center px-6 text-center">
          <div>
            <p
              className="text-sm uppercase tracking-widest"
              style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-fg-variant)" }}
            >
              ÜRÜN BULUNAMADI
            </p>
            <button
              type="button"
              onClick={goHome}
              className="mt-4 text-xs uppercase underline"
              style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-primary)" }}
            >
              Menüye dön
            </button>
          </div>
        </div>
      ) : null}
    </TechGourmetShell>
  );
}
