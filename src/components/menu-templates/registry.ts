import type { ComponentType } from "react";

import { AlbaMenuTemplate } from "./alba";
import { DarkMenuTemplate } from "./dark";
import { GlassyGrayMenuTemplate } from "./glassy-gray";
import { LumiereMenuTemplate } from "./lumiere";
import { LumenMenuTemplate } from "./lumen";
import { SoftMenuTemplate } from "./soft";
import type { MenuTemplateProps } from "./types";

export type MenuTemplateDefinition = {
  id: string;
  name: string;
  previewClassName: string;
  Component: ComponentType<MenuTemplateProps>;
};

export const MENU_TEMPLATES = [
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
  {
    id: "lumiere",
    name: "Lumière",
    previewClassName: "bg-[#f8f9fb] text-[#b80035]",
    Component: LumiereMenuTemplate,
  },
  {
    id: "lumen",
    name: "Lumen",
    previewClassName: "bg-[#2a241c] text-[#e8c57a]",
    Component: LumenMenuTemplate,
  },
  {
    id: "alba",
    name: "Alba",
    previewClassName: "bg-[#f4f7f9] text-[#1f6f78]",
    Component: AlbaMenuTemplate,
  },
  {
    id: "soft",
    name: "Soft",
    previewClassName: "bg-[#f7f6f3] text-[#1c1917]",
    Component: SoftMenuTemplate,
  },
] as const satisfies readonly MenuTemplateDefinition[];

export type MenuThemeId = (typeof MENU_TEMPLATES)[number]["id"];

export const DEFAULT_MENU_THEME_ID: MenuThemeId = "soft";

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
