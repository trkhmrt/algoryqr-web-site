import type { ComponentType } from "react";

import { ClassicMenuTemplate } from "./classic";
import { DarkMenuTemplate } from "./dark";
import { GlassyGrayMenuTemplate } from "./glassy-gray";
import { MinimalMenuTemplate } from "./minimal";
import { ModernMenuTemplate } from "./modern";
import type { MenuTemplateProps } from "./types";

export type MenuTemplateDefinition = {
  id: string;
  name: string;
  previewClassName: string;
  Component: ComponentType<MenuTemplateProps>;
};

export const MENU_TEMPLATES = [
  {
    id: "classic",
    name: "Klasik",
    previewClassName: "bg-amber-50 text-amber-900",
    Component: ClassicMenuTemplate,
  },
  {
    id: "modern",
    name: "Modern",
    previewClassName: "bg-slate-900 text-white",
    Component: ModernMenuTemplate,
  },
  {
    id: "minimal",
    name: "Minimal",
    previewClassName: "bg-white text-neutral-900 border",
    Component: MinimalMenuTemplate,
  },
  {
    id: "dark",
    name: "Koyu",
    previewClassName: "bg-neutral-950 text-neutral-100",
    Component: DarkMenuTemplate,
  },
  {
    id: "glassy-gray",
    name: "Glassy Gray",
    previewClassName: "bg-[#131313] text-[#ffb693]",
    Component: GlassyGrayMenuTemplate,
  },
] as const satisfies readonly MenuTemplateDefinition[];

export type MenuThemeId = (typeof MENU_TEMPLATES)[number]["id"];

export const DEFAULT_MENU_THEME_ID: MenuThemeId = "classic";

const TEMPLATE_BY_ID = Object.fromEntries(
  MENU_TEMPLATES.map((template) => [template.id, template]),
) as Record<MenuThemeId, (typeof MENU_TEMPLATES)[number]>;

export function isMenuThemeId(value: string): value is MenuThemeId {
  return value in TEMPLATE_BY_ID;
}

export function resolveMenuThemeId(value: unknown): MenuThemeId {
  const raw = typeof value === "string" ? value : "";
  return isMenuThemeId(raw) ? raw : DEFAULT_MENU_THEME_ID;
}

export function getMenuTemplate(themeId: string) {
  return TEMPLATE_BY_ID[resolveMenuThemeId(themeId)];
}

export function getMenuTemplateOptions() {
  return MENU_TEMPLATES.map(({ id, name, previewClassName }) => ({
    id,
    name,
    previewClassName,
  }));
}
