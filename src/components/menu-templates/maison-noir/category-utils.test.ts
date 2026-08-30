import { describe, expect, it } from "vitest";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import {
  filterMaisonCategoryProducts,
  MAISON_CATEGORY_PRODUCT_PAGE_SIZE,
  resolveMaisonFilterNode,
} from "./category-utils";

const MAIN_ID = 1_000_001;
const SUB_A_ID = 101;
const SUB_B_ID = 102;

const mainCategory: TaxonomyNavNode = {
  categoryId: MAIN_ID,
  name: "Ana Yemekler",
  parentId: null,
  sortOrder: 1,
  kind: "main",
  mainCategoryId: 1,
  subCategoryId: null,
  children: [
    {
      categoryId: SUB_A_ID,
      name: "Etler",
      parentId: MAIN_ID,
      sortOrder: 1,
      kind: "sub",
      mainCategoryId: 1,
      subCategoryId: SUB_A_ID,
      children: [],
    },
    {
      categoryId: SUB_B_ID,
      name: "Balık",
      parentId: MAIN_ID,
      sortOrder: 2,
      kind: "sub",
      mainCategoryId: 1,
      subCategoryId: SUB_B_ID,
      children: [],
    },
  ],
};

function product(
  id: number,
  subCategoryId: number | null,
  sortOrder: number,
  available = true,
): MenuProductApiItem {
  return {
    productId: id,
    menuId: 1,
    name: `Ürün ${id}`,
    price: 100,
    currency: "TRY",
    sortOrder,
    available,
    mainCategoryId: 1,
    subCategoryId,
  } as MenuProductApiItem;
}

describe("maison-noir category-utils", () => {
  it("exposes a 50 item page size", () => {
    expect(MAISON_CATEGORY_PRODUCT_PAGE_SIZE).toBe(50);
  });

  it("resolveMaisonFilterNode returns main when sub filter is null", () => {
    expect(resolveMaisonFilterNode(mainCategory, null)).toBe(mainCategory);
  });

  it("resolveMaisonFilterNode returns matching subcategory", () => {
    expect(resolveMaisonFilterNode(mainCategory, SUB_A_ID)?.categoryId).toBe(SUB_A_ID);
  });

  it("filterMaisonCategoryProducts returns all main products when sub filter is null", () => {
    const products = [
      product(1, SUB_A_ID, 2),
      product(2, SUB_B_ID, 1),
      product(3, null, 3),
    ];

    const result = filterMaisonCategoryProducts(products, mainCategory, null);

    expect(result.map((item) => item.productId)).toEqual([2, 1, 3]);
  });

  it("filterMaisonCategoryProducts filters by subcategory", () => {
    const products = [product(1, SUB_A_ID, 1), product(2, SUB_B_ID, 2)];

    const result = filterMaisonCategoryProducts(products, mainCategory, SUB_A_ID);

    expect(result.map((item) => item.productId)).toEqual([1]);
  });

  it("filterMaisonCategoryProducts excludes unavailable products", () => {
    const products = [product(1, SUB_A_ID, 1, false), product(2, SUB_A_ID, 2, true)];

    const result = filterMaisonCategoryProducts(products, mainCategory, SUB_A_ID);

    expect(result.map((item) => item.productId)).toEqual([2]);
  });
});
