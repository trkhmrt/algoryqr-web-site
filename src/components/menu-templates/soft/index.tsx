"use client";

import { useState } from "react";

import type { MenuProductApiItem } from "@/lib/api";
import type { MenuTemplateProps } from "../types";
import { useRegisterChefOpenProduct } from "../shared";
import { SoftHomeView } from "./HomeView";
import { SoftProductDetailSheet } from "./ProductDetailSheet";
import { SoftShell } from "./SoftShell";

export function SoftMenuTemplate({
  menu,
  products,
  categories = [],
  analytics,
}: MenuTemplateProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<"all" | number>("all");
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<"all" | number>(
    "all",
  );
  const [selectedProduct, setSelectedProduct] =
    useState<MenuProductApiItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectCategory = (id: "all" | number) => {
    setActiveCategoryId(id);
    setActiveSubCategoryId("all");
    if (id !== "all") {
      analytics?.trackCategoryView(id);
    }
  };

  const selectSubCategory = (id: "all" | number) => {
    setActiveSubCategoryId(id);
    if (id !== "all") {
      analytics?.trackCategoryView(id);
    }
  };

  const openProduct = (product: MenuProductApiItem) => {
    setSelectedProduct(product);
    setSheetOpen(true);
    analytics?.trackProductView(product.productId, product.categoryId ?? null);
  };

  useRegisterChefOpenProduct(openProduct);

  return (
    <SoftShell>
      <SoftHomeView
        menu={menu}
        categories={categories}
        products={products}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategoryId={activeCategoryId}
        onSelectCategory={selectCategory}
        activeSubCategoryId={activeSubCategoryId}
        onSelectSubCategory={selectSubCategory}
        onOpenProduct={openProduct}
      />
      <SoftProductDetailSheet
        product={selectedProduct}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelectedProduct(null);
        }}
      />
    </SoftShell>
  );
}
