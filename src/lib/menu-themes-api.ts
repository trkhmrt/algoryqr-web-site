"use client";

import { api } from "@/lib/api/client";

export interface MenuThemePreviewMeta {
  swatch?: string;
}

export interface MenuThemeApiItem {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  previewMeta?: MenuThemePreviewMeta | null;
  sortOrder: number;
  active: boolean;
}

export async function fetchMenuThemes(): Promise<MenuThemeApiItem[]> {
  const response = await api.get<MenuThemeApiItem[]>("/menu/themes");
  return Array.isArray(response.data) ? response.data : [];
}

export function sortActiveMenuThemes(themes: MenuThemeApiItem[]): MenuThemeApiItem[] {
  return themes
    .filter((theme) => theme.active !== false)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}
