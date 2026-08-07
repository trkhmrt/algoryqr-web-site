"use client";

import { useMemo, useState } from "react";

import type { MenuProductApiItem } from "@/lib/api";
import type { MenuTemplateProps, TaxonomyNavNode } from "../types";
import {
  filterProductsByNavNode,
  findCategoryById,
  resolveProductNavCategory,
  taxonomyAsNavTree,
  trackIdForNavNode,
} from "../types";
import {
  DenseProductRow,
  MenuProductScrollSentinel,
  resolveSelectedProduct,
  searchMenuProducts,
  useRegisterChefOpenProduct,
} from "../shared";
import {
  type GlassyView,
  firstRootCategory,
  popularProducts,
} from "./category-utils";
import { GlassyGrayCategoryView } from "./CategoryView";
import { GlassyGrayShell } from "./GlassyGrayShell";
import { GlassyGrayHomeView } from "./HomeView";
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
    activeCategoryId != null ? findCategoryById(displayCategories, activeCategoryId) : null;

  const categoryProducts = useMemo(
    () => filterProductsByNavNode(products, activeCategory),
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
    const first = firstRootCategory(displayCategories);
    if (first) {
      setView({ type: "category", categoryId: first.categoryId });
      analytics?.trackCategoryView(trackIdForNavNode(first));
    } else {
      setView({ type: "home" });
    }
    setSearchValue("");
    setPinnedProduct(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectCategory = (category: TaxonomyNavNode) => {
    setSearchValue("");
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
      goMenu();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeNav: "home" | "menu" = view.type === "home" ? "home" : "menu";
  const showSearch = view.type === "category" || view.type === "home";

  return (
    <GlassyGrayShell
      menu={menu}
      categories={displayCategories}
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
          <h2 className="gg-display mb-3 text-lg font-bold text-white">
            Arama sonuçları
          </h2>
          <p className="gg-muted mb-4 text-sm">
            “{searchValue.trim()}” için {globalResults.length} sonuç
          </p>
          {globalResults.length > 0 ? (
            <div>
              {globalResults.map((item) => (
                <DenseProductRow
                  key={item.productId}
                  item={item}
                  onOpen={openProduct}
                  className="border-white/10"
                  imageClassName="bg-white/5"
                  titleClassName="text-white gg-display"
                  priceClassName="gg-primary"
                  descriptionClassName="gg-muted"
                  chipClassName="bg-white/10 gg-muted"
                  accentChipClassName="bg-[var(--gg-primary)] text-[#1a120e]"
                  destructiveChipClassName="bg-red-500/20 text-red-300"
                  imagePlaceholderClassName="gg-muted"
                />
              ))}
            </div>
          ) : (
            <p className="gg-glass-heavy gg-muted rounded-2xl p-8 text-center text-sm">
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
