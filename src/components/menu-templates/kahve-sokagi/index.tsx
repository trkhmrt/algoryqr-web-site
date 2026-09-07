"use client";

import { useMemo, useState } from "react";

import type { MenuProductApiItem } from "@/lib/api";
import type { MenuTemplateProps } from "../types";
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
  useMenuLocale,
  useMenuProductFeed,
  usePublicMenuDeepLinkProduct,
  usePublicMenuViewState,
  useRegisterChefOpenProduct,
} from "../shared";
import { LuxuryCategoryView } from "../luxury/CategoryView";
import { LuxuryProductDetailView } from "../luxury/ProductDetailView";
import type { LuxuryView } from "../luxury/category-utils";

import { KAHVE_ALL_TAB, type KahveHomeTab } from "./category-utils";
import { KahveSokagiHomeView } from "./HomeView";
import { KahveSokagiShell } from "./Shell";

export function KahveSokagiMenuTemplate({
  menu,
  products,
  categories = [],
  analytics,
}: MenuTemplateProps) {
  const { t } = useMenuLocale();
  const [view, setView, { replaceView, goBack }] = usePublicMenuViewState<LuxuryView>({
    type: "home",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [homeTab, setHomeTab] = useState<KahveHomeTab>({ type: KAHVE_ALL_TAB });
  const [pinnedProduct, setPinnedProduct] = useState<MenuProductApiItem | null>(null);

  usePublicMenuDeepLinkProduct({
    publicId: menu.publicId ?? "",
    view,
    products,
    pinnedProduct,
    setPinnedProduct,
  });

  const feedback = useMenuFeedback(
    menu.publicId ?? "",
    menu.ratingAvg != null ? Number(menu.ratingAvg) : null,
    menu.ratingCount ?? 0,
  );

  const categoryFeed = useMenuCategoryFeed();
  const productFeed = useMenuProductFeed();
  const taxonomySource =
    categoryFeed.categories.length > 0 ? categoryFeed.categories : categories;
  const displayCategories = useMemo(
    () => taxonomyAsNavTree(taxonomySource),
    [taxonomySource],
  );
  const displayProducts = productFeed.products.length > 0 ? productFeed.products : products;
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
    return resolveSelectedProduct(displayProducts, view.productId, pinnedProduct);
  }, [view, displayProducts, pinnedProduct]);

  const goHome = () => {
    setPinnedProduct(null);
    feedback.syncProductState(null);
    replaceView({ type: "home" });
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

  const backFromCategory = () => {
    setSearchQuery("");
    setPinnedProduct(null);
    feedback.syncProductState(null);
    goBack();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <KahveSokagiShell
      menu={menu}
      homeTab={homeTab}
      onSelectHomeTab={(tab) => {
        setHomeTab(tab);
        setSearchQuery("");
        goHome();
      }}
      onBrandClick={goHome}
    >
      {view.type === "home" ? (
        <KahveSokagiHomeView
          menu={menu}
          categories={displayCategories}
          products={displayProducts}
          searchQuery={searchQuery}
          activeTab={homeTab}
          onSearchChange={setSearchQuery}
          onSelectTab={(tab) => {
            setHomeTab(tab);
            setSearchQuery("");
            if (tab.type === "category") {
              const category = findCategoryById(displayCategories, tab.categoryId);
              if (category) {
                analytics?.trackCategoryView(trackIdForNavNode(category));
              }
            }
          }}
          onOpenProduct={openProduct}
          onBrandClick={goHome}
        />
      ) : null}

      {view.type === "category" && activeCategory ? (
        <LuxuryCategoryView
          category={activeCategory}
          categories={displayCategories}
          products={displayProducts}
          onHome={backFromCategory}
          onSelectCategory={(category) => {
            setView({ type: "category", categoryId: category.categoryId });
          }}
          onOpenProduct={openProduct}
        />
      ) : null}

      {view.type === "category" && !activeCategory ? (
        <MissingState message={t.missingCategory} onHome={goHome} />
      ) : null}

      {view.type === "product" && selectedProduct ? (
        <LuxuryProductDetailView
          product={selectedProduct}
          categories={displayCategories}
          onBack={backFromProduct}
          onHome={goHome}
          onSelectCategory={(category) => {
            setView({ type: "category", categoryId: category.categoryId });
          }}
          feedbackControl={feedback.product}
        />
      ) : null}

      {view.type === "product" && !selectedProduct ? (
        <MissingState message={t.missingProduct} onHome={goHome} />
      ) : null}
    </KahveSokagiShell>
  );
}

function MissingState({ message, onHome }: { message: string; onHome: () => void }) {
  const { t } = useMenuLocale();

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6 text-center">
      <div>
        <p className="text-sm text-[var(--lx-muted)]">{message}</p>
        <button
          type="button"
          onClick={onHome}
          className="mt-4 text-sm text-[var(--ks-secondary)] underline"
        >
          {t.backToMenu}
        </button>
      </div>
    </div>
  );
}
