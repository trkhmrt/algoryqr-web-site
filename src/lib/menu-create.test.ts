import { describe, expect, it } from "vitest";

import { buildMenuCreateDetails } from "./menu-create";

describe("buildMenuCreateDetails", () => {
  it("includes firma adı, slogan and products", () => {
    const details = buildMenuCreateDetails(
      {
        businessName: "Kafe İstanbul",
        slogan: "Lezzetin adresi",
        themeId: "luxury",
      },
      [{ name: "Espresso", price: 120, category: "İçecekler" }],
    );

    expect(details.businessName).toBe("Kafe İstanbul");
    expect(details.slogan).toBe("Lezzetin adresi");
    expect(details.products).toHaveLength(1);
    expect(details.products[0]?.name).toBe("Espresso");
  });

  it("includes sourceMenuId when copying from an existing menu", () => {
    const details = buildMenuCreateDetails(
      {
        businessName: "Yeni Şube",
        themeId: "luxury",
      },
      [],
      { sourceMenuId: 42 },
    );

    expect(details.sourceMenuId).toBe(42);
  });

  it("includes branchId when creating for a branch", () => {
    const details = buildMenuCreateDetails(
      {
        businessName: "Kafe İstanbul",
        themeId: "luxury",
      },
      [],
      { branchId: 9 },
    );

    expect(details.branchId).toBe(9);
  });
});
