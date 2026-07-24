"use client";

import { useMenuVisitAnalytics } from "@/hooks/use-menu-visit-analytics";

import { getMenuTemplate } from "./registry";
import type { MenuTemplateProps } from "./types";

export function MenuTemplateRenderer({
  menu,
  products,
  categories = [],
  themeId,
}: MenuTemplateProps & { themeId: string }) {
  const analytics = useMenuVisitAnalytics(menu.menuId);
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
