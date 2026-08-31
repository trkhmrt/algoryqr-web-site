import type { MainCategoryApiItem, MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";

import { lookupTranslation, uniqueTexts } from "./google-translate";

function addText(bucket: string[], value?: string | null) {
  if (value == null) return;
  const trimmed = value.trim();
  if (trimmed) bucket.push(trimmed);
}

export function collectMenuProfileTexts(menu: MenuProfileApiItem): string[] {
  const texts: string[] = [];
  addText(texts, menu.businessName);
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

function localized(dict: Record<string, string>, value: string): string {
  return lookupTranslation(dict, value);
}

function localizedOptional(
  dict: Record<string, string>,
  value?: string | null,
): string | undefined {
  if (value == null) return undefined;
  if (!value.trim()) return value;
  return localized(dict, value);
}

export function localizeMenuProfile(
  menu: MenuProfileApiItem,
  dict: Record<string, string>,
): MenuProfileApiItem {
  return {
    ...menu,
    businessName: localized(dict, menu.businessName),
    slogan: localizedOptional(dict, menu.slogan) ?? menu.slogan,
  };
}

export function localizeCategories(
  categories: MainCategoryApiItem[],
  dict: Record<string, string>,
): MainCategoryApiItem[] {
  return categories.map((category) => ({
    ...category,
    name: localized(dict, category.name),
    subs: (category.subs ?? []).map((sub) => ({
      ...sub,
      name: localized(dict, sub.name),
    })),
  }));
}

export function localizeProducts(
  products: MenuProductApiItem[],
  dict: Record<string, string>,
): MenuProductApiItem[] {
  return products.map((product) => ({
    ...product,
    name: localized(dict, product.name),
    description: localizedOptional(dict, product.description) ?? product.description,
    subCategoryName: localizedOptional(dict, product.subCategoryName) ?? product.subCategoryName,
    mainCategoryName: localizedOptional(dict, product.mainCategoryName) ?? product.mainCategoryName,
    tags: product.tags?.map((tag) => ({ ...tag, name: localized(dict, tag.name) })),
    allergens: product.allergens?.map((allergen) => ({
      ...allergen,
      name: localized(dict, allergen.name),
    })),
  }));
}
