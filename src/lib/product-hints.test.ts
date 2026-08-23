import { describe, expect, it } from "vitest";

import { getProductHint, getProductHintByCode, PRODUCT_HINTS } from "./product-hints";

describe("product-hints", () => {
  it("returns hints for catalog product codes", () => {
    expect(getProductHint("CUSTOM_DESIGN")?.title).toContain("Özel tasarım");
    expect(getProductHint("WAITER_PANEL")?.description).toContain("Garson");
    expect(getProductHint("QR_BRANCH")?.title).toContain("Şube");
    expect(getProductHintByCode("SMART_REPORTING")).toEqual(PRODUCT_HINTS.SMART_REPORTING);
  });

  it("normalizes legacy product code aliases", () => {
    expect(getProductHint("QR_ANALYTICS")).toEqual(PRODUCT_HINTS.SMART_REPORTING);
    expect(getProductHint("QR_AGENT")).toEqual(PRODUCT_HINTS.SMART_ASSISTANT);
  });
});
