import { describe, expect, it } from "vitest";

import { isPaytrCheckout, paytrCheckoutHtml } from "./paytr-checkout";

describe("paytrCheckoutHtml", () => {
  it("wraps checkout html with brand canvas", () => {
    const html = paytrCheckoutHtml("<form id=\"paytr-direct-card-form\"></form>");

    expect(html).toContain("Manrope");
    expect(html).toContain("linear-gradient(160deg, #ffffff 0%, #f7f7f8 58%, #f1f1f2 100%)");
    expect(html).toContain("<form id=\"paytr-direct-card-form\"></form>");
  });

  it("recognizes html overlay as paytr checkout", () => {
    expect(isPaytrCheckout({ kind: "html", content: "<form></form>" })).toBe(true);
  });
});
