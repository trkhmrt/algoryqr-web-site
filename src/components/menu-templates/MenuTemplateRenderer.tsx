"use client";

import { type ComponentProps, Suspense } from "react";

import { useMenuVisitAnalytics } from "@/hooks/use-menu-visit-analytics";

import { MenuThemeLayout } from "./MenuThemeLayout";
import { MenuChefFab } from "./chef";
import { getMenuTemplate } from "./registry";
import {
  CustomerAccountMenu,
  CampaignProductIdsProvider,
  MenuLocaleProvider,
  MenuProductNavigatorProvider,
  OrderingProvider,
  PublicMenuDataProvider,
  PublicMenuThemeProvider,
  SharedMenuChrome,
  useMenuLocale,
  useMenuProductFeed,
  useMenuCategoryFeed,
} from "./shared";
import type { MenuTemplateRendererProps } from "./types";

function MenuTemplateBody({
  menu,
  themeId,
  analytics,
}: Omit<
  MenuTemplateRendererProps,
  | "products"
  | "productPage"
  | "productSize"
  | "productTotalElements"
  | "productHasNext"
  | "identifier"
  | "categories"
  | "categoryPage"
  | "categorySize"
  | "categoryTotalElements"
  | "categoryHasNext"
> & {
  analytics: ReturnType<typeof useMenuVisitAnalytics>;
}) {
  const { products } = useMenuProductFeed();
  const { categories } = useMenuCategoryFeed();
  const { Component } = getMenuTemplate(themeId);

  return (
    <MenuThemeLayout themeId={themeId}>
      <Component
        menu={menu}
        products={products}
        categories={categories}
        analytics={analytics}
      />
    </MenuThemeLayout>
  );
}

function MenuShell({
  menu,
  products,
  categories = [],
  themeId,
  identifier,
  productPage = 0,
  productSize = 20,
  productHasNext = false,
  categoryPage = 0,
  categorySize = 6,
  categoryHasNext = false,
}: MenuTemplateRendererProps) {
  const analytics = useMenuVisitAnalytics(menu.menuId);
  const qrIdentifier = identifier ?? String(menu.qrId);
  const { dir } = useMenuLocale();

  return (
    <PublicMenuThemeProvider themeId={themeId}>
      <div dir={dir}>
        <PublicMenuDataProvider
          menuId={menu.menuId}
          initialCategories={categories}
          initialProducts={products}
          categoryPage={categoryPage}
          categorySize={categorySize}
          categoryHasNext={categoryHasNext}
          productPage={productPage}
          productSize={productSize}
          productHasNext={productHasNext}
        >
          <MenuProductNavigatorProvider>
            <Suspense fallback={null}>
              <OrderingProvider identifier={qrIdentifier} menuId={menu.menuId}>
                <CampaignProductIdsProvider identifier={qrIdentifier}>
                  <CustomerAccountMenu menuId={menu.menuId}>
                    <MenuTemplateBody
                      menu={menu}
                      themeId={themeId}
                      analytics={analytics}
                    />
                    <SharedMenuChrome menuId={menu.menuId} />
                    <MenuChefFab
                      menuId={menu.menuId}
                      chefName={menu.chefName}
                      chefDisplayName={menu.chefDisplayName}
                      chefAvatarUrl={menu.chefAvatarUrl}
                    />
                  </CustomerAccountMenu>
                </CampaignProductIdsProvider>
              </OrderingProvider>
            </Suspense>
          </MenuProductNavigatorProvider>
        </PublicMenuDataProvider>
      </div>
    </PublicMenuThemeProvider>
  );
}

export function MenuTemplateRenderer(props: MenuTemplateRendererProps) {
  return (
    <MenuLocaleProvider>
      <MenuShell {...props} />
    </MenuLocaleProvider>
  );
}
