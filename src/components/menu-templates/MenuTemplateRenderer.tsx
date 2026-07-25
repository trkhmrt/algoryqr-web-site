"use client";

import { useMenuVisitAnalytics } from "@/hooks/use-menu-visit-analytics";

import { MenuChefFab } from "./chef";
import { getMenuTemplate } from "./registry";
import {
  MenuProductFeed,
  MenuProductNavigatorProvider,
  useMenuProductFeed,
} from "./shared";
import type { MenuTemplateRendererProps } from "./types";

function MenuTemplateBody({
  menu,
  categories = [],
  themeId,
  analytics,
}: Omit<MenuTemplateRendererProps, "products" | "productPage" | "productSize" | "productTotalElements" | "productHasNext"> & {
  analytics: ReturnType<typeof useMenuVisitAnalytics>;
}) {
  const { products } = useMenuProductFeed();
  const { Component } = getMenuTemplate(themeId);
  return (
    <Component
      menu={menu}
      products={products}
      categories={categories}
      analytics={analytics}
    />
  );
}

export function MenuTemplateRenderer({
  menu,
  products,
  categories = [],
  themeId,
  productPage = 0,
  productSize = 20,
  productHasNext = false,
}: MenuTemplateRendererProps) {
  const analytics = useMenuVisitAnalytics(menu.menuId);

  return (
    <MenuProductFeed
      menuId={menu.menuId}
      initialProducts={products}
      productPage={productPage}
      productSize={productSize}
      productHasNext={productHasNext}
    >
      <MenuProductNavigatorProvider>
        <MenuTemplateBody
          menu={menu}
          categories={categories}
          themeId={themeId}
          analytics={analytics}
        />
        <MenuChefFab menuId={menu.menuId} />
      </MenuProductNavigatorProvider>
    </MenuProductFeed>
  );
}
