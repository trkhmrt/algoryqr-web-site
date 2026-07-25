import { describe, expect, it } from "vitest";

import { buildMenuCreateDetails } from "./menu-create";

describe("buildMenuCreateDetails", () => {
  it("includes firma adı, slogan and products", () => {
    const details = buildMenuCreateDetails(
      {
        businessName: "Kafe İstanbul",
        slogan: "Lezzetin adresi",
        themeId: "soft",
        urlMode: "id",
      },
      [{ name: "Espresso", price: 120, category: "İçecekler" }],
    );

    expect(details.businessName).toBe("Kafe İstanbul");
    expect(details.slogan).toBe("Lezzetin adresi");
    expect(details.urlMode).toBe("ID");
    expect(details.products).toHaveLength(1);
    expect(details.products[0]?.name).toBe("Espresso");
  });
});
