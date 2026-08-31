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
  usePublicMenuDeepLinkProduct,
  usePublicMenuViewState,
  useRegisterChefOpenProduct,
} from "../shared";
import type { ModernBistroView } from "./category-utils";
import { ModernBistroCategoryView } from "./CategoryView";
import { ModernBistroHomeView } from "./HomeView";
import { ModernBistroProductDetailView } from "./ProductDetailView";
import { ModernBistroShell } from "./Shell";

export function ModernBistroMenuTemplate({
  menu,
  products,
  categories = [],
  analytics,
}: MenuTemplateProps) {
  const [view, setView, { replaceView, goBack }] = usePublicMenuViewState<ModernBistroView>({ type: "home" });
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedProduct, setPinnedProduct] = useState<MenuProductApiItem | null>(null);

  usePublicMenuDeepLinkProduct({
    menuId: menu.menuId,
    view,
    products,
    pinnedProduct,
    setPinnedProduct,
  });

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
    replaceView({ type: "home" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const leaveCategory = () => {
    setSearchQuery("");
    setPinnedProduct(null);
    feedback.syncProductState(null);
    goBack();
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
    goBack();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <ModernBistroShell menu={menu}>
      {view.type === "home" ? (
        <ModernBistroHomeView
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
        <ModernBistroCategoryView
          category={activeCategory}
          products={products}
          onHome={leaveCategory}
          onOpenProduct={openProduct}
        />
      ) : null}

      {view.type === "category" && !activeCategory ? (
        <div className="flex min-h-[60vh] items-center justify-center px-6 text-center text-sm text-[var(--mb-muted)]">
          <div>
            <p>Kategori bulunamadı.</p>
            <button type="button" onClick={goHome} className="mt-4 underline">
              Menüye dön
            </button>
          </div>
        </div>
      ) : null}

      {view.type === "product" && selectedProduct ? (
        <ModernBistroProductDetailView
          product={selectedProduct}
          categories={displayCategories}
          onBack={backFromProduct}
          onHome={goHome}
          onSelectCategory={selectCategory}
        />
      ) : null}

      {view.type === "product" && !selectedProduct ? (
        <div className="flex min-h-[60vh] items-center justify-center px-6 text-center text-sm text-[var(--mb-muted)]">
          <div>
            <p>Ürün bulunamadı.</p>
            <button type="button" onClick={goHome} className="mt-4 underline">
              Menüye dön
            </button>
          </div>
        </div>
      ) : null}
    </ModernBistroShell>
  );
}
