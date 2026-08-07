"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getPublicMenuRatingRequest,
  submitPublicMenuRatingRequest,
  type MenuProductApiItem,
} from "@/lib/api";
import type { MenuTemplateProps } from "../types";
import {
  MenuPartySizeControl,
  getStoredPartySize,
  productMatchesServesPeople,
  setStoredPartySize,
  useRegisterChefOpenProduct,
} from "../shared";
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
  const [partySize, setPartySize] = useState<number | null>(null);
  const [menuRatingAvg, setMenuRatingAvg] = useState<number | null>(
    Number(menu.ratingAvg) > 0 ? Number(menu.ratingAvg) : null,
  );
  const [menuRatingCount, setMenuRatingCount] = useState<number>(menu.ratingCount ?? 0);
  const [menuUserRating, setMenuUserRating] = useState<number | null>(menu.userRating ?? null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  useEffect(() => {
    setPartySize(getStoredPartySize(menu.menuId));
  }, [menu.menuId]);

  useEffect(() => {
    let active = true;
    void getPublicMenuRatingRequest(menu.menuId)
      .then((data) => {
        if (!active) return;
        const avg = Number(data.ratingAvg);
        setMenuRatingAvg(Number.isFinite(avg) && avg > 0 ? avg : null);
        setMenuRatingCount(data.ratingCount ?? 0);
        setMenuUserRating(data.userRating ?? null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [menu.menuId]);

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
    analytics?.trackProductView(product.productId, product.subCategoryId ?? null);
  };

  const onPartySizeChange = (value: number | null) => {
    setPartySize(value);
    setStoredPartySize(menu.menuId, value);
    if (value != null) {
      analytics?.trackServesFilter(value);
    }
  };

  const handleRateMenu = async (value: number) => {
    if (ratingSubmitting) return;
    setRatingSubmitting(true);
    try {
      const data = await submitPublicMenuRatingRequest(menu.menuId, value);
      const avg = Number(data.ratingAvg);
      setMenuRatingAvg(Number.isFinite(avg) && avg > 0 ? avg : null);
      setMenuRatingCount(data.ratingCount ?? menuRatingCount);
      setMenuUserRating(data.userRating ?? value);
    } catch {
      setMenuUserRating(value);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const filteredProducts = useMemo(
    () => products.filter((product) => productMatchesServesPeople(product, partySize)),
    [products, partySize],
  );

  useRegisterChefOpenProduct(openProduct);

  return (
    <SoftShell>
      <SoftHomeView
        menu={menu}
        categories={categories}
        products={filteredProducts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategoryId={activeCategoryId}
        onSelectCategory={selectCategory}
        activeSubCategoryId={activeSubCategoryId}
        onSelectSubCategory={selectSubCategory}
        onOpenProduct={openProduct}
        partySizeControl={
          <MenuPartySizeControl
            value={partySize}
            onChange={onPartySizeChange}
            activeButtonClassName="bg-[var(--sf-fg)] text-[var(--sf-bg)] border-transparent"
            buttonClassName="sf-fg"
          />
        }
        ratingControl={{
          ratingAvg: menuRatingAvg,
          ratingCount: menuRatingCount,
          userRating: menuUserRating,
          onRate: (value) => void handleRateMenu(value),
          submitting: ratingSubmitting,
        }}
      />
      <SoftProductDetailSheet
        product={selectedProduct}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelectedProduct(null);
        }}
        onOpenProduct={openProduct}
        menuRating={{
          ratingAvg: menuRatingAvg,
          ratingCount: menuRatingCount,
          userRating: menuUserRating,
        }}
      />
    </SoftShell>
  );
}
