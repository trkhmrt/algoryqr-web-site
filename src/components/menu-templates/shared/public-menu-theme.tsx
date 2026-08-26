"use client";

import { createContext, useContext, type ReactNode } from "react";

import { BIGARADE_CATEGORY_MARKS, BIGARADE_HERO_IMAGE, BIGARADE_PANEL_BG, BIGARADE_STYLES } from "../bigarade/styles";
import { ELIXIR_CATEGORY_MARKS, ELIXIR_HERO_IMAGE, ELIXIR_PANEL_BG, ELIXIR_STYLES } from "../elixir/styles";
import { FOLIO_CATEGORY_MARKS, FOLIO_HERO_IMAGE, FOLIO_PANEL_BG, FOLIO_STYLES } from "../folio-rouge/styles";
import { LUCITE_CATEGORY_MARKS, LUCITE_HERO_IMAGE, LUCITE_PANEL_BG, LUCITE_STYLES } from "../lucite-gris/styles";
import { LUXURY_CONTACT_BG, LUXURY_FEEDBACK_BG, LUXURY_HERO_IMAGE, LUXURY_RESERVATION_BG, LUXURY_STYLES } from "../luxury/styles";
import { RUBRIC_CATEGORY_MARKS, RUBRIC_HERO_IMAGE, RUBRIC_PANEL_BG, RUBRIC_STYLES } from "../rubric/styles";
import { PETITE_CATEGORY_MARKS, PETITE_HERO_IMAGE, PETITE_PANEL_BG, PETITE_STYLES } from "../petite-patisserie/styles";
import {
  CLEVER_DISH_SCRIBE_CATEGORY_MARKS,
  CLEVER_DISH_SCRIBE_HERO_IMAGE,
  CLEVER_DISH_SCRIBE_STYLES,
} from "../clever-dish-scribe/styles";
import {
  MAISON_NOIR_CATEGORY_MARKS,
  MAISON_NOIR_HERO_IMAGE,
  MAISON_NOIR_STYLES,
} from "../maison-noir/styles";
import {
  MODERN_BISTRO_CATEGORY_MARKS,
  MODERN_BISTRO_HERO_IMAGE,
  MODERN_BISTRO_STYLES,
} from "../modern-bistro/styles";
import { TECH_GOURMET_CATEGORY_MARKS, TECH_GOURMET_STYLES } from "../tech-gourmet/styles";

export type PublicMenuThemeId =
  | "luxury"
  | "petite-patisserie"
  | "folio-rouge"
  | "lucite-gris"
  | "rubric"
  | "bigarade"
  | "elixir"
  | "tech-gourmet"
  | "modern-bistro"
  | "clever-dish-scribe"
  | "maison-noir";

export type PublicMenuThemeLayout = "classic" | "editorial" | "elixir";

export type PublicMenuThemeChrome = {
  id: PublicMenuThemeId;
  layout: PublicMenuThemeLayout;
  rootClassName: string;
  styles: string;
  footerKicker: string;
  defaultSlogan: string;
  heroImage: string;
  reservationBackgroundUrl: string;
  contactBackgroundUrl: string;
  feedbackBackgroundUrl: string;
  loadingBg: string;
  categoryMarks: readonly string[];
};

const LUXURY_CHROME: PublicMenuThemeChrome = {
  id: "luxury",
  layout: "editorial",
  rootClassName: "luxury-menu",
  styles: LUXURY_STYLES,
  footerKicker: "Fine dining",
  defaultSlogan: "Mevsimin en taze malzemeleriyle hazırlanan modern mutfak.",
  heroImage: LUXURY_HERO_IMAGE,
  reservationBackgroundUrl: LUXURY_RESERVATION_BG,
  contactBackgroundUrl: LUXURY_CONTACT_BG,
  feedbackBackgroundUrl: LUXURY_FEEDBACK_BG,
  loadingBg: "#D4CFC4",
  categoryMarks: ["◐", "◆", "◇", "◈", "❋", "✦", "◉"],
};

const PETITE_CHROME: PublicMenuThemeChrome = {
  id: "petite-patisserie",
  layout: "classic",
  rootClassName: "petite-menu",
  styles: PETITE_STYLES,
  footerKicker: "Petite pâtisserie",
  defaultSlogan: "Günlük hamur, yumuşak mint ve vitrine taze tatlılar.",
  heroImage: PETITE_HERO_IMAGE,
  reservationBackgroundUrl: PETITE_PANEL_BG,
  contactBackgroundUrl: PETITE_PANEL_BG,
  feedbackBackgroundUrl: PETITE_PANEL_BG,
  loadingBg: "#F9F6EE",
  categoryMarks: PETITE_CATEGORY_MARKS,
};

const FOLIO_CHROME: PublicMenuThemeChrome = {
  id: "folio-rouge",
  layout: "classic",
  rootClassName: "folio-menu",
  styles: FOLIO_STYLES,
  footerKicker: "Plexi Rouge",
  defaultSlogan: "Beyaz mat metal, yakut pleksi, sakin bir masa.",
  heroImage: FOLIO_HERO_IMAGE,
  reservationBackgroundUrl: FOLIO_PANEL_BG,
  contactBackgroundUrl: FOLIO_PANEL_BG,
  feedbackBackgroundUrl: FOLIO_PANEL_BG,
  loadingBg: "#F4F1EC",
  categoryMarks: FOLIO_CATEGORY_MARKS,
};

const LUCITE_CHROME: PublicMenuThemeChrome = {
  id: "lucite-gris",
  layout: "classic",
  rootClassName: "lucite-menu",
  styles: LUCITE_STYLES,
  footerKicker: "Lucite Gris",
  defaultSlogan: "Dumanlı lucite, fırçalanmış pirinç, sakin bir bar masası.",
  heroImage: LUCITE_HERO_IMAGE,
  reservationBackgroundUrl: LUCITE_PANEL_BG,
  contactBackgroundUrl: LUCITE_PANEL_BG,
  feedbackBackgroundUrl: LUCITE_PANEL_BG,
  loadingBg: "#D6D4D0",
  categoryMarks: LUCITE_CATEGORY_MARKS,
};

const RUBRIC_CHROME: PublicMenuThemeChrome = {
  id: "rubric",
  layout: "editorial",
  rootClassName: "rubric-menu",
  styles: RUBRIC_STYLES,
  footerKicker: "Rubric",
  defaultSlogan: "Yumuşak kırık beyaz, sıkı ızgara, derin kızıl bir işaret.",
  heroImage: RUBRIC_HERO_IMAGE,
  reservationBackgroundUrl: RUBRIC_PANEL_BG,
  contactBackgroundUrl: RUBRIC_PANEL_BG,
  feedbackBackgroundUrl: RUBRIC_PANEL_BG,
  loadingBg: "#F6F4F0",
  categoryMarks: RUBRIC_CATEGORY_MARKS,
};

const BIGARADE_CHROME: PublicMenuThemeChrome = {
  id: "bigarade",
  layout: "editorial",
  rootClassName: "bigarade-menu",
  styles: BIGARADE_STYLES,
  footerKicker: "Bigarade",
  defaultSlogan: "Turunç kabuğu, sıcak kâğıt, net bir sipariş ızgarası.",
  heroImage: BIGARADE_HERO_IMAGE,
  reservationBackgroundUrl: BIGARADE_PANEL_BG,
  contactBackgroundUrl: BIGARADE_PANEL_BG,
  feedbackBackgroundUrl: BIGARADE_PANEL_BG,
  loadingBg: "#FFF4EA",
  categoryMarks: BIGARADE_CATEGORY_MARKS,
};

const ELIXIR_CHROME: PublicMenuThemeChrome = {
  id: "elixir",
  layout: "elixir",
  rootClassName: "elixir-menu",
  styles: ELIXIR_STYLES,
  footerKicker: "Elixir",
  defaultSlogan: "Gece mavisi, lavanta cam, yumuşak bir keşif.",
  heroImage: ELIXIR_HERO_IMAGE,
  reservationBackgroundUrl: ELIXIR_PANEL_BG,
  contactBackgroundUrl: ELIXIR_PANEL_BG,
  feedbackBackgroundUrl: ELIXIR_PANEL_BG,
  loadingBg: "#10102e",
  categoryMarks: ELIXIR_CATEGORY_MARKS,
};

const TECH_GOURMET_CHROME: PublicMenuThemeChrome = {
  id: "tech-gourmet",
  layout: "editorial",
  rootClassName: "tech-gourmet-menu",
  styles: TECH_GOURMET_STYLES,
  footerKicker: "Tech.Gourmet",
  defaultSlogan: "Hassas mühendislikle hazırlanmış mutfak deneyimleri.",
  heroImage: "",
  reservationBackgroundUrl: "",
  contactBackgroundUrl: "",
  feedbackBackgroundUrl: "",
  loadingBg: "#131313",
  categoryMarks: TECH_GOURMET_CATEGORY_MARKS,
};

const MODERN_BISTRO_CHROME: PublicMenuThemeChrome = {
  id: "modern-bistro",
  layout: "editorial",
  rootClassName: "modern-bistro-menu",
  styles: MODERN_BISTRO_STYLES,
  footerKicker: "Modern Bistro",
  defaultSlogan: "Temiz arayüz, hızlı keşif, akıcı sipariş deneyimi.",
  heroImage: MODERN_BISTRO_HERO_IMAGE,
  reservationBackgroundUrl: MODERN_BISTRO_HERO_IMAGE,
  contactBackgroundUrl: MODERN_BISTRO_HERO_IMAGE,
  feedbackBackgroundUrl: MODERN_BISTRO_HERO_IMAGE,
  loadingBg: "#fafafa",
  categoryMarks: MODERN_BISTRO_CATEGORY_MARKS,
};

const CLEVER_DISH_SCRIBE_CHROME: PublicMenuThemeChrome = {
  id: "clever-dish-scribe",
  layout: "editorial",
  rootClassName: "clever-dish-scribe-menu",
  styles: CLEVER_DISH_SCRIBE_STYLES,
  footerKicker: "Clever Dish Scribe",
  defaultSlogan: "Karanlık arayüz, yeşil vurgular, akıcı mobil keşif.",
  heroImage: CLEVER_DISH_SCRIBE_HERO_IMAGE,
  reservationBackgroundUrl: CLEVER_DISH_SCRIBE_HERO_IMAGE,
  contactBackgroundUrl: CLEVER_DISH_SCRIBE_HERO_IMAGE,
  feedbackBackgroundUrl: CLEVER_DISH_SCRIBE_HERO_IMAGE,
  loadingBg: "#0a0a0a",
  categoryMarks: CLEVER_DISH_SCRIBE_CATEGORY_MARKS,
};

const MAISON_NOIR_CHROME: PublicMenuThemeChrome = {
  id: "maison-noir",
  layout: "editorial",
  rootClassName: "maison-noir-menu",
  styles: MAISON_NOIR_STYLES,
  footerKicker: "Maison Noir",
  defaultSlogan:
    "Akşam servisi 19.00 — 24.00 arasındadır. Menümüz mevsimin getirdiği ürünlerle her hafta yeniden yazılır.",
  heroImage: MAISON_NOIR_HERO_IMAGE,
  reservationBackgroundUrl: MAISON_NOIR_HERO_IMAGE,
  contactBackgroundUrl: MAISON_NOIR_HERO_IMAGE,
  feedbackBackgroundUrl: MAISON_NOIR_HERO_IMAGE,
  loadingBg: "#1c1a17",
  categoryMarks: MAISON_NOIR_CATEGORY_MARKS,
};

const CHROME_BY_ID: Record<PublicMenuThemeId, PublicMenuThemeChrome> = {
  luxury: LUXURY_CHROME,
  "petite-patisserie": PETITE_CHROME,
  "folio-rouge": FOLIO_CHROME,
  "lucite-gris": LUCITE_CHROME,
  rubric: RUBRIC_CHROME,
  bigarade: BIGARADE_CHROME,
  elixir: ELIXIR_CHROME,
  "tech-gourmet": TECH_GOURMET_CHROME,
  "modern-bistro": MODERN_BISTRO_CHROME,
  "clever-dish-scribe": CLEVER_DISH_SCRIBE_CHROME,
  "maison-noir": MAISON_NOIR_CHROME,
};

export function getPublicMenuThemeChrome(themeId: string): PublicMenuThemeChrome {
  if (themeId in CHROME_BY_ID) {
    return CHROME_BY_ID[themeId as PublicMenuThemeId];
  }
  return LUXURY_CHROME;
}

const PublicMenuThemeContext = createContext<PublicMenuThemeChrome>(LUXURY_CHROME);

export function PublicMenuThemeProvider({
  themeId,
  children,
}: {
  themeId: string;
  children: ReactNode;
}) {
  const value = getPublicMenuThemeChrome(themeId);
  return (
    <PublicMenuThemeContext.Provider value={value}>{children}</PublicMenuThemeContext.Provider>
  );
}

export function usePublicMenuTheme(): PublicMenuThemeChrome {
  return useContext(PublicMenuThemeContext);
}
