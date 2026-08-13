"use client";

import type { ReactNode } from "react";

import { resolveMenuThemeId, type MenuThemeId } from "./registry";

/**
 * Tema id’sine göre menü (2. aşama) kabuğu.
 * Karşılama aşaması ortak kalır; ürün/kategori görünümleri bu layout içine gelir.
 * Bugün her tema kendi Shell’ini kullanıyor; sonraki adımda Shell’ler buraya taşınır.
 */
export function MenuThemeLayout({
  themeId,
  children,
}: {
  themeId: string;
  children: ReactNode;
}) {
  const resolved: MenuThemeId = resolveMenuThemeId(themeId);
  return <div data-menu-theme={resolved}>{children}</div>;
}
