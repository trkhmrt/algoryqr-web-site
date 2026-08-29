"use client";

import { type ComponentProps, Suspense, useEffect } from "react";

import { useMenuVisitAnalytics } from "@/hooks/use-menu-visit-analytics";

import { MenuThemeLayout } from "./MenuThemeLayout";
import { MenuChefFab } from "./chef";
import { getMenuTemplate } from "./registry";
import {
  CustomerAccountMenu,
  MenuCategoryFeed,
  MenuExperienceProvider,
  CampaignProductIdsProvider,
  MenuLocaleProvider,
  MenuProductFeed,
  MenuProductNavigatorProvider,
  MenuWelcomeStage,
  OrderingProvider,
  PublicMenuThemeProvider,
  SharedMenuChrome,
  useMenuExperience,
  useMenuExperienceOptional,
  useMenuLocale,
  useMenuProductFeed,
  useMenuCategoryFeed,
} from "./shared";
import type { MenuTemplateRendererProps } from "./types";

function gateStorageKey(identifier: string) {
  return `algory_menu_entry_done:${identifier}`;
}

function MenuChefFabGate(props: ComponentProps<typeof MenuChefFab>) {
  const experience = useMenuExperienceOptional();
  if (experience?.stage !== "menu") return null;
  return <MenuChefFab {...props} />;
}

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
  const { stage } = useMenuExperience();
  const { Component } = getMenuTemplate(themeId);

  if (stage !== "menu") {
    return <MenuWelcomeStage menu={menu} />;
  }

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
  categoryTotalElements,
  categoryHasNext = false,
}: MenuTemplateRendererProps) {
  const analytics = useMenuVisitAnalytics(menu.menuId);
  const qrIdentifier = identifier ?? String(menu.qrId);
  const { dir } = useMenuLocale();

  useEffect(() => {
    try {
      window.sessionStorage.setItem(gateStorageKey(qrIdentifier), "1");
    } catch {
      /* ignore */
    }
  }, [qrIdentifier]);

  return (
    <PublicMenuThemeProvider themeId={themeId}>
      <div dir={dir}>
        <MenuProductFeed
          menuId={menu.menuId}
          initialProducts={products}
          productPage={productPage}
          productSize={productSize}
          productHasNext={productHasNext}
        >
          <MenuCategoryFeed
            initialCategories={categories}
            categoryPage={categoryPage}
            categorySize={categorySize}
            categoryHasNext={categoryHasNext}
            categoryTotalElements={categoryTotalElements}
          >
            <MenuProductNavigatorProvider>
              <Suspense fallback={null}>
                <OrderingProvider identifier={qrIdentifier} menuId={menu.menuId}>
                  <CampaignProductIdsProvider identifier={qrIdentifier}>
                    <MenuExperienceProvider>
                      <CustomerAccountMenu menuId={menu.menuId}>
                        <MenuTemplateBody
                          menu={menu}
                          themeId={themeId}
                          analytics={analytics}
                        />
                        <SharedMenuChrome menuId={menu.menuId} />
                        <MenuChefFabGate
                          menuId={menu.menuId}
                          chefName={menu.chefName}
                          chefDisplayName={menu.chefDisplayName}
                          chefAvatarUrl={menu.chefAvatarUrl}
                        />
                      </CustomerAccountMenu>
                    </MenuExperienceProvider>
                  </CampaignProductIdsProvider>
                </OrderingProvider>
              </Suspense>
            </MenuProductNavigatorProvider>
          </MenuCategoryFeed>
        </MenuProductFeed>
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
