import { describe, expect, it } from "vitest";

import type { MainCategoryApiItem, MenuProductApiItem } from "@/lib/api";

import {
  collectMenuContentTexts,
  localizeCategories,
  localizeProducts,
} from "./menu-content-i18n";

const category: MainCategoryApiItem = {
  id: 1,
  slug: "corbalar",
  name: "Çorbalar",
  sortOrder: 0,
  subs: [{ id: 2, mainCategoryId: 1, slug: "sicak", name: "Sıcak", sortOrder: 0 }],
};

const product: MenuProductApiItem = {
  productId: 10,
  menuId: 1,
  name: "Mercimek çorbası",
  description: "Kırmızı mercimek",
  currency: "TRY",
  subCategoryId: 2,
  subCategoryName: "Sıcak",
  mainCategoryName: "Çorbalar",
  sortOrder: 0,
  available: true,
  tags: [{ id: 1, slug: "vegan", name: "Vegan", sortOrder: 0 }],
  allergens: [{ id: 1, slug: "gluten", name: "Gluten", sortOrder: 0 }],
};

describe("collectMenuContentTexts", () => {
  it("collects unique names from categories and products", () => {
    const texts = collectMenuContentTexts([product], [category]);
    expect(texts).toEqual([
      "Çorbalar",
      "Sıcak",
      "Mercimek çorbası",
      "Kırmızı mercimek",
      "Vegan",
      "Gluten",
    ]);
  });
});

describe("localize overlay", () => {
  const dict = {
    Çorbalar: "Soups",
    Sıcak: "Hot",
    "Mercimek çorbası": "Lentil soup",
    "Kırmızı mercimek": "Red lentils",
    Vegan: "Vegan",
    Gluten: "Gluten",
  };

  it("localizes category tree", () => {
    const [localized] = localizeCategories([category], dict);
    expect(localized.name).toBe("Soups");
    expect(localized.subs[0].name).toBe("Hot");
  });

  it("localizes product fields and keeps ids", () => {
    const [localized] = localizeProducts([product], dict);
    expect(localized.productId).toBe(10);
    expect(localized.name).toBe("Lentil soup");
    expect(localized.description).toBe("Red lentils");
    expect(localized.subCategoryName).toBe("Hot");
    expect(localized.tags?.[0].name).toBe("Vegan");
  });

  it("keeps original when dict is empty", () => {
    const [localized] = localizeProducts([product], {});
    expect(localized.name).toBe("Mercimek çorbası");
  });

  it("falls back to translate when dict misses", () => {
    const translate = (text: string) => (text === "Çorbalar" ? "Soups" : text);
    const [localized] = localizeCategories([category], {}, translate);
    expect(localized.name).toBe("Soups");
  });
});
