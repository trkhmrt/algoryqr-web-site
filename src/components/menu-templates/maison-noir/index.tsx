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
import type { MaisonNoirView } from "./category-utils";
import { MaisonNoirCategoryView } from "./CategoryView";
import { MaisonNoirHomeView } from "./HomeView";
import { MaisonNoirProductDetailView } from "./ProductDetailView";
import { MaisonNoirShell } from "./Shell";

const EMPTY_FALLBACK = {
  missingCategory: "Kategori bulunamadı.",
  missingProduct: "Ürün bulunamadı.",
  backToMenu: "Menüye dön",
} as const;

export function MaisonNoirMenuTemplate({
  menu,
  products,
  categories = [],
  analytics,
}: MenuTemplateProps) {
  const [view, setView] = useState<MaisonNoirView>({ type: "home" });
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
    setPinnedProduct(null);
    feedback.syncProductState(null);
    setView({ type: "home" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectCategory = (category: TaxonomyNavNode) => {
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

  return (
    <MaisonNoirShell menu={menu} onBrandClick={goHome}>
      {view.type === "home" ? (
        <MaisonNoirHomeView
          menu={menu}
          categories={displayCategories}
          products={products}
          onSelectCategory={selectCategory}
          onOpenProduct={openProduct}
        />
      ) : null}

      {view.type === "category" && activeCategory ? (
        <MaisonNoirCategoryView
          category={activeCategory}
          products={products}
          onHome={goHome}
          onOpenProduct={openProduct}
        />
      ) : null}

      {view.type === "category" && !activeCategory ? (
        <MissingState message={EMPTY_FALLBACK.missingCategory} onHome={goHome} />
      ) : null}

      {view.type === "product" && selectedProduct ? (
        <MaisonNoirProductDetailView
          product={selectedProduct}
          categories={displayCategories}
          onBack={backFromProduct}
          onHome={goHome}
          onSelectCategory={selectCategory}
        />
      ) : null}

      {view.type === "product" && !selectedProduct ? (
        <MissingState message={EMPTY_FALLBACK.missingProduct} onHome={goHome} />
      ) : null}
    </MaisonNoirShell>
  );
}

function MissingState({ message, onHome }: { message: string; onHome: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 text-center text-sm text-[var(--mn-muted)]">
      <div>
        <p>{message}</p>
        <button
          type="button"
          onClick={onHome}
          className="mt-4 mn-tracked text-[0.58rem] text-[var(--mn-primary)] underline"
        >
          {EMPTY_FALLBACK.backToMenu}
        </button>
      </div>
    </div>
  );
}
