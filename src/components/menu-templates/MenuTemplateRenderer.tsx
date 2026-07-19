import { getMenuTemplate } from "./registry";
import type { MenuTemplateProps } from "./types";

export function MenuTemplateRenderer({
  menu,
  products,
  categories = [],
  themeId,
}: MenuTemplateProps & { themeId: string }) {
  const { Component } = getMenuTemplate(themeId);
  return <Component menu={menu} products={products} categories={categories} />;
}
