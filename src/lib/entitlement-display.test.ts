import { describe, expect, it } from "vitest";

import {
  canCreateMenu,
  formatEntitlementRemaining,
  formatEntitlementUsageSummary,
  formatEntitlementUsed,
  formatMenuQuotaLabel,
  summarizeMenuEntitlements,
} from "./entitlement-display";

describe("entitlement-display", () => {
  it("formats countable QR menu usage", () => {
    const product = {
      productCode: "QR_MENU",
      unlimited: false,
      usedQuantity: 1,
      totalQuantity: 1,
      remainingQuantity: 0,
      usable: true,
      expired: false,
    };

    expect(formatEntitlementUsageSummary(product)).toBe("1/1 · 0 kalan");
    expect(formatEntitlementUsed(product)).toBe("1/1");
    expect(formatEntitlementRemaining(product)).toBe("0");
  });

  it("formats scope-only products as active", () => {
    const product = {
      productCode: "SMART_ASSISTANT",
      unlimited: false,
      usedQuantity: 0,
      totalQuantity: 1,
      remainingQuantity: 1,
      usable: true,
      expired: false,
    };

    expect(formatEntitlementUsageSummary(product)).toBe("Aktif");
    expect(formatEntitlementUsed(product)).toBe("Kullanımda");
    expect(formatEntitlementRemaining(product)).toBe("Aktif");
  });

  it("summarizes menu quota across entitlements", () => {
    const summary = summarizeMenuEntitlements([
      {
        id: 1,
        productId: 2,
        productCode: "QR_MENU",
        productName: "QR Menu",
        purchaseId: 10,
        totalQuantity: 5,
        remainingQuantity: 3,
        usedQuantity: 2,
        unlimited: false,
        usable: true,
        expired: false,
      },
    ]);

    expect(summary).toEqual({
      remaining: 3,
      total: 5,
      used: 2,
      unlimited: false,
    });
    expect(formatMenuQuotaLabel(summary)).toBe("3 menü hakkınız kaldı");
    expect(canCreateMenu(summary)).toBe(true);
  });

  it("blocks create when menu quota is exhausted", () => {
    const summary = summarizeMenuEntitlements([
      {
        id: 1,
        productId: 2,
        productCode: "QR_MENU",
        productName: "QR Menu",
        purchaseId: 10,
        totalQuantity: 1,
        remainingQuantity: 0,
        usedQuantity: 1,
        unlimited: false,
        usable: true,
        expired: false,
      },
    ]);

    expect(canCreateMenu(summary)).toBe(false);
    expect(formatMenuQuotaLabel(summary)).toBe("Dijital menü hakkınız doldu");
  });
});
