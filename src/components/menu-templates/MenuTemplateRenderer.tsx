"use client";

import { Suspense, useEffect, useMemo } from "react";

import { useGoogleTranslateOptional } from "@/components/google-translate-provider";
import { useMenuVisitAnalytics } from "@/hooks/use-menu-visit-analytics";
import {
  collectMenuProfileTexts,
  localizeMenuProfile,
} from "@/lib/menu-content-i18n";
import {
  menuGuestScopeKey,
  resolveMenuGuestDefaults,
} from "@/lib/menu-guest-defaults";

import { MenuThemeLayout } from "./MenuThemeLayout";
import { MenuChefFab } from "./chef";
import { getMenuTemplate } from "./registry";
import {
  CustomerAccountMenu,
  CampaignProductIdsProvider,
  MenuCurrencyProvider,
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
import { GoogleTranslateProvider } from "@/components/google-translate-provider";

const EMPTY_DICT: Record<string, string> = {};

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
  const i18n = useGoogleTranslateOptional();
  const ensureTranslations = i18n?.ensureTranslations;
  const translate = i18n?.translate;
  const dict = i18n?.dict ?? EMPTY_DICT;
  const profileTexts = useMemo(() => collectMenuProfileTexts(menu), [menu]);

  useEffect(() => {
    void ensureTranslations?.(profileTexts);
  }, [ensureTranslations, profileTexts]);

  const localizedMenu = useMemo(
    () => localizeMenuProfile(menu, dict, translate),
    [dict, menu, translate],
  );

  return (
    <MenuThemeLayout themeId={themeId}>
      <Component
        menu={localizedMenu}
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
  categorySize = 50,
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
                    {themeId !== "maison-noir" && themeId !== "modern-bistro" ? (
                      <MenuChefFab
                        menuId={menu.menuId}
                        chefName={menu.chefName}
                        chefDisplayName={menu.chefDisplayName}
                        chefAvatarUrl={menu.chefAvatarUrl}
                      />
                    ) : null}
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
  const guestDefaults = resolveMenuGuestDefaults({
    menuId: props.menu.menuId,
    qrId: props.menu.qrId,
    businessName: props.menu.businessName,
    identifier: props.identifier,
  });
  const scopeKey = menuGuestScopeKey(props.menu.menuId);

  return (
    <MenuLocaleProvider scopeKey={scopeKey} defaultLocale={guestDefaults.locale}>
      <MenuCurrencyProvider scopeKey={scopeKey} defaultCurrency={guestDefaults.currency}>
        <GoogleTranslateProvider>
          <MenuShell {...props} />
        </GoogleTranslateProvider>
      </MenuCurrencyProvider>
    </MenuLocaleProvider>
  );
}
