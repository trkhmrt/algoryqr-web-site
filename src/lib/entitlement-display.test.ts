import { describe, expect, it } from "vitest";

import {
  canCreateMenu,
  formatEntitlementRemaining,
  formatEntitlementUsageSummary,
  formatEntitlementUsed,
  formatPackageEntitlementName,
  formatPackageEntitlementUsageSummary,
  formatMenuQuotaLabel,
  formatQrCreateQuotaLabel,
  hasQrCreateQuotaRemaining,
  summarizeMenuEntitlements,
  summarizeQrCreateQuota,
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

  it("formats package branch entitlement as a package right", () => {
    const product = {
      productCode: "QR_BRANCH",
      productName: "Ek Sube",
      unlimited: false,
      usedQuantity: 0,
      totalQuantity: 1,
      remainingQuantity: 1,
      usable: true,
      expired: false,
    };

    expect(formatPackageEntitlementName(product)).toBe("Şube hakkı");
    expect(formatPackageEntitlementUsageSummary(product)).toBe("Adet 1");
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

  it("formats QR create quota labels", () => {
    const exhausted = summarizeQrCreateQuota({
      remaining: 0,
      total: 5,
      used: 5,
      unlimited: false,
      usable: true,
    });
    expect(formatQrCreateQuotaLabel(exhausted)).toBe("QR oluşturma hakkınız bitti");
    expect(hasQrCreateQuotaRemaining(exhausted)).toBe(false);

    const remaining = summarizeQrCreateQuota({
      remaining: 2,
      total: 5,
      used: 3,
      unlimited: false,
      usable: true,
    });
    expect(formatQrCreateQuotaLabel(remaining)).toBe("2 QR oluşturma hakkınız kaldı");
    expect(hasQrCreateQuotaRemaining(remaining)).toBe(true);
  });
});
