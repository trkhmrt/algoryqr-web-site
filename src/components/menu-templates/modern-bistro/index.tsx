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

const EMPTY_FALLBACK = {
  missingCategory: "Kategori bulunamadı.",
  missingProduct: "Ürün bulunamadı.",
  backToMenu: "Menüye dön",
} as const;

export function ModernBistroMenuTemplate({
  menu,
  products,
  categories = [],
  analytics,
}: MenuTemplateProps) {
  const [view, setView, { replaceView, goBack }] = usePublicMenuViewState<ModernBistroView>(
    { type: "home" },
    { supportsSubCategory: true },
  );
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

  const activeSubCategoryId =
    view.type === "category"
      ? view.subCategoryId
      : view.type === "product"
        ? view.subCategoryId
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

  const backToCategories = () => {
    setPinnedProduct(null);
    feedback.syncProductState(null);
    goBack();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectCategory = (category: TaxonomyNavNode) => {
    setSearchQuery("");
    setPinnedProduct(null);
    feedback.syncProductState(null);
    setView({ type: "category", categoryId: category.categoryId, subCategoryId: null });
    analytics?.trackCategoryView(trackIdForNavNode(category));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectSubCategory = (subCategoryId: number | null) => {
    if (view.type !== "category") return;
    setView({ type: "category", categoryId: view.categoryId, subCategoryId });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openProduct = (product: MenuProductApiItem) => {
    const productCategory = resolveProductNavCategory(displayCategories, product);
    const categoryId = productCategory?.categoryId ?? activeCategoryId;
    const subCategoryId =
      view.type === "category"
        ? view.subCategoryId
        : view.type === "product"
          ? view.subCategoryId
          : productCategory?.kind === "sub"
            ? productCategory.categoryId
            : null;

    setPinnedProduct(product);
    feedback.syncProductState(product);
    setView({
      type: "product",
      productId: product.productId,
      categoryId,
      subCategoryId,
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
        />
      ) : null}

      {view.type === "category" && activeCategory ? (
        <ModernBistroCategoryView
          category={activeCategory}
          products={products}
          subCategoryId={activeSubCategoryId}
          onBackToCategories={backToCategories}
          onSelectSubCategory={selectSubCategory}
          onOpenProduct={openProduct}
        />
      ) : null}

      {view.type === "category" && !activeCategory ? (
        <MissingState message={EMPTY_FALLBACK.missingCategory} onHome={goHome} />
      ) : null}

      {view.type === "product" && selectedProduct ? (
        <ModernBistroProductDetailView
          product={selectedProduct}
          categories={displayCategories}
          onBack={backFromProduct}
        />
      ) : null}

      {view.type === "product" && !selectedProduct ? (
        <MissingState message={EMPTY_FALLBACK.missingProduct} onHome={goHome} />
      ) : null}
    </ModernBistroShell>
  );
}

function MissingState({ message, onHome }: { message: string; onHome: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 text-center text-sm text-[var(--mb-muted)]">
      <div>
        <p>{message}</p>
        <button type="button" onClick={onHome} className="mt-4 underline">
          {EMPTY_FALLBACK.backToMenu}
        </button>
      </div>
    </div>
  );
}
