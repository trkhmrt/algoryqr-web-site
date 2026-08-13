import { describe, expect, it } from "vitest";

import { stripProductListFromReply } from "./strip-product-list-from-reply";

describe("stripProductListFromReply", () => {
  it("keeps intro/closing and removes bullet product lines", () => {
    const reply = [
      "Bütçenize uygun birkaç seçenek buldum:",
      "",
      "• Margherita Pizza - 180 TL",
      "• Karışık Pizza — 220 ₺",
      "",
      "Afiyet olsun!",
    ].join("\n");

    expect(
      stripProductListFromReply(reply, ["Margherita Pizza", "Karışık Pizza"]),
    ).toBe("Bütçenize uygun birkaç seçenek buldum:\n\nAfiyet olsun!");
  });

  it("removes numbered product lines with prices", () => {
    const reply = [
      "Şunları önerebilirim:",
      "1) Mercimek Çorbası 90 TL",
      "2. Izgara Köfte 250 TL",
      "Başka bir şey isterseniz söyleyin.",
    ].join("\n");

    expect(
      stripProductListFromReply(reply, ["Mercimek Çorbası", "Izgara Köfte"]),
    ).toBe("Başka bir şey isterseniz söyleyin.");
  });

  it("returns a short fallback when only product lines remain", () => {
    const reply = "- Latte 95 TL\n- Espresso 70 TL";
    expect(stripProductListFromReply(reply, ["Latte", "Espresso"])).toBe(
      "Menüden birkaç seçenek önerdim.",
    );
  });

  it("leaves text unchanged when there are no product names", () => {
    const reply = "Menüde ürün bulamadım.";
    expect(stripProductListFromReply(reply, [])).toBe(reply);
  });
});
