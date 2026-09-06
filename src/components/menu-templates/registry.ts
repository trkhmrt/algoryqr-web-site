import type { ComponentType } from "react";

import { CleverDishScribeMenuTemplate } from "./clever-dish-scribe";
import { KahveSokagiMenuTemplate } from "./kahve-sokagi";
import { LuxuryMenuTemplate } from "./luxury";
import { MaisonNoirMenuTemplate } from "./maison-noir";
import { ModernBistroMenuTemplate } from "./modern-bistro";
import { TechGourmetMenuTemplate } from "./tech-gourmet";
import type { MenuTemplateProps } from "./types";

export type MenuTemplateDefinition = {
  id: string;
  name: string;
  previewClassName: string;
  Component: ComponentType<MenuTemplateProps>;
};

export const MENU_TEMPLATES = [
  {
    id: "luxury",
    name: "Luxury",
    previewClassName: "bg-[#2a241c] text-[#e8c57a]",
    Component: LuxuryMenuTemplate,
  },
  {
    id: "petite-patisserie",
    name: "Petite Patisserie",
    previewClassName: "bg-[#F9F6EE] text-[#4E7B6C]",
    Component: LuxuryMenuTemplate,
  },
  {
    id: "folio-rouge",
    name: "Plexi Rouge",
    previewClassName: "bg-[#E3E1DD] text-[#B21833]",
    Component: LuxuryMenuTemplate,
  },
  {
    id: "lucite-gris",
    name: "Lucite Gris",
    previewClassName: "bg-[#D6D4D0] text-[#B08D57]",
    Component: LuxuryMenuTemplate,
  },
  {
    id: "rubric",
    name: "Rubric",
    previewClassName: "bg-[#F6F4F0] text-[#A50021]",
    Component: LuxuryMenuTemplate,
  },
  {
    id: "bigarade",
    name: "Bigarade",
    previewClassName: "bg-[#FFF4EA] text-[#FF4F0F]",
    Component: LuxuryMenuTemplate,
  },
  {
    id: "elixir",
    name: "Elixir",
    previewClassName: "bg-[#10102e] text-[#c0c1ff]",
    Component: LuxuryMenuTemplate,
  },
  {
    id: "tech-gourmet",
    name: "Tech.Gourmet",
    previewClassName: "bg-[#131313] text-[#b7cbbf]",
    Component: TechGourmetMenuTemplate,
  },
  {
    id: "modern-bistro",
    name: "Modern Bistro",
    previewClassName: "bg-[#fafafa] text-[#111111]",
    Component: ModernBistroMenuTemplate,
  },
  {
    id: "clever-dish-scribe",
    name: "Clever Dish Scribe",
    previewClassName: "bg-[#0a0a0a] text-[#22c55e]",
    Component: CleverDishScribeMenuTemplate,
  },
  {
    id: "maison-noir",
    name: "Maison Noir",
    previewClassName: "bg-[#1c1a17] text-[#d4b46a]",
    Component: MaisonNoirMenuTemplate,
  },
  {
    id: "kahve-sokagi",
    name: "Köfteli Usta",
    previewClassName: "bg-[#fbf9f5] text-[#a23f00]",
    Component: KahveSokagiMenuTemplate,
  },
] as const satisfies readonly MenuTemplateDefinition[];

export type MenuThemeId = (typeof MENU_TEMPLATES)[number]["id"];

export const DEFAULT_MENU_THEME_ID: MenuThemeId = "luxury";

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
