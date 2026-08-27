import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { MenuProductApiItem } from "@/lib/api";
import type { ChefProductItem } from "@/lib/chef/parse-chef-query";
import { matchChefProductsToCatalog } from "@/lib/chef/match-chef-products-to-catalog";

describe("matchChefProductsToCatalog", () => {
  it("remaps stale agent productId to catalog id by name", () => {
    const catalog: MenuProductApiItem[] = [
      {
        productId: 9001,
        menuId: 7,
        name: "Karnıyarık",
        price: 250,
        currency: "TRY",
        subCategoryId: 1,
        sortOrder: 0,
        available: true,
      },
    ];
    const agentProducts: ChefProductItem[] = [
      {
        productId: 42,
        menuId: 7,
        name: "Karnıyarık",
        description: null,
        subCategoryId: null,
        price: 250,
        currency: "TRY",
        imageUrl: null,
        available: true,
      },
    ];

    const resolved = matchChefProductsToCatalog(catalog, agentProducts);
    assert.equal(resolved.length, 1);
    assert.equal(resolved[0]?.productId, 9001);
  });

  it("keeps matching productId when present in catalog", () => {
    const catalog: MenuProductApiItem[] = [
      {
        productId: 42,
        menuId: 7,
        name: "Ayran",
        price: 40,
        currency: "TRY",
        subCategoryId: 2,
        sortOrder: 0,
        available: true,
      },
    ];
    const agentProducts: ChefProductItem[] = [
      {
        productId: 42,
        menuId: 7,
        name: "Ayran",
        description: null,
        subCategoryId: null,
        price: 40,
        currency: "TRY",
        imageUrl: null,
        available: true,
      },
    ];

    const resolved = matchChefProductsToCatalog(catalog, agentProducts);
    assert.equal(resolved[0]?.productId, 42);
  });

  it("drops products missing from catalog", () => {
    const resolved = matchChefProductsToCatalog(
      [],
      [
        {
          productId: 1,
          menuId: 7,
          name: "Yok",
          description: null,
          subCategoryId: null,
          price: 10,
          currency: "TRY",
          imageUrl: null,
          available: true,
        },
      ],
    );
    assert.equal(resolved.length, 0);
  });
});
