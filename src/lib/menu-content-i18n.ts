import type { MainCategoryApiItem, MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";

import { uniqueTexts } from "./google-translate";

export type MenuContentTranslateFn = (text: string) => string;

function resolveLocalizedText(
  dict: Record<string, string>,
  value: string,
  translate?: MenuContentTranslateFn,
): string {
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (dict[trimmed] != null) return dict[trimmed];
  return translate ? translate(value) : value;
}

function addText(bucket: string[], value?: string | null) {
  if (value == null) return;
  const trimmed = value.trim();
  if (trimmed) bucket.push(trimmed);
}

export function collectMenuProfileTexts(menu: MenuProfileApiItem): string[] {
  const texts: string[] = [];
  addText(texts, menu.slogan);
  return uniqueTexts(texts);
}

export function collectMenuContentTexts(
  products: MenuProductApiItem[],
  categories: MainCategoryApiItem[],
): string[] {
  const texts: string[] = [];
  for (const category of categories) {
    addText(texts, category.name);
    for (const sub of category.subs ?? []) {
      addText(texts, sub.name);
    }
  }
  for (const product of products) {
    addText(texts, product.name);
    addText(texts, product.description);
    addText(texts, product.subCategoryName);
    addText(texts, product.mainCategoryName);
    for (const tag of product.tags ?? []) {
      addText(texts, tag.name);
    }
    for (const allergen of product.allergens ?? []) {
      addText(texts, allergen.name);
    }
  }
  return uniqueTexts(texts);
}

function localizedOptional(
  dict: Record<string, string>,
  value: string | null | undefined,
  translate?: MenuContentTranslateFn,
): string | undefined {
  if (value == null) return undefined;
  if (!value.trim()) return value;
  return resolveLocalizedText(dict, value, translate);
}

export function localizeMenuProfile(
  menu: MenuProfileApiItem,
  dict: Record<string, string>,
  translate?: MenuContentTranslateFn,
): MenuProfileApiItem {
  return {
    ...menu,
    businessName: menu.businessName,
    slogan: localizedOptional(dict, menu.slogan, translate) ?? menu.slogan,
  };
}

export function localizeCategories(
  categories: MainCategoryApiItem[],
  dict: Record<string, string>,
  translate?: MenuContentTranslateFn,
): MainCategoryApiItem[] {
  return categories.map((category) => ({
    ...category,
    name: resolveLocalizedText(dict, category.name, translate),
    subs: (category.subs ?? []).map((sub) => ({
      ...sub,
      name: resolveLocalizedText(dict, sub.name, translate),
    })),
  }));
}

export function localizeProducts(
  products: MenuProductApiItem[],
  dict: Record<string, string>,
  translate?: MenuContentTranslateFn,
): MenuProductApiItem[] {
  return products.map((product) => ({
    ...product,
    name: resolveLocalizedText(dict, product.name, translate),
    description: localizedOptional(dict, product.description, translate) ?? product.description,
    subCategoryName:
      localizedOptional(dict, product.subCategoryName, translate) ?? product.subCategoryName,
    mainCategoryName:
      localizedOptional(dict, product.mainCategoryName, translate) ?? product.mainCategoryName,
    tags: product.tags?.map((tag) => ({
      ...tag,
      name: resolveLocalizedText(dict, tag.name, translate),
    })),
    allergens: product.allergens?.map((allergen) => ({
      ...allergen,
      name: resolveLocalizedText(dict, allergen.name, translate),
    })),
  }));
}
