import { describe, expect, it } from "vitest";

import { aggregatePackageUsage } from "./api";
import type { PurchaseApiItem, UserEntitlementApiItem } from "./api";

describe("aggregatePackageUsage", () => {
  it("uses only active purchase QR_CREATE entitlements", () => {
    const purchases: PurchaseApiItem[] = [
      {
        id: 10,
        packageName: "Ultimate",
        packageCode: "ULTIMATE_PACKAGE",
        purchaseType: "PAID",
        status: "ACTIVE",
        usable: true,
        expired: false,
        expiresAt: "2099-01-01T00:00:00.000Z",
      },
      {
        id: 11,
        packageName: "Pro",
        packageCode: "PRO_PACKAGE",
        purchaseType: "PAID",
        status: "SUPERSEDED",
        usable: false,
        expired: true,
        expiresAt: "2020-01-01T00:00:00.000Z",
      },
    ];
    const entitlements: UserEntitlementApiItem[] = [
      {
        id: 1,
        productId: 1,
        productCode: "QR_CREATE",
        productName: "QR",
        purchaseId: 10,
        totalQuantity: 100,
        remainingQuantity: 97,
        usedQuantity: 3,
        unlimited: false,
        usable: true,
        expired: false,
      },
      {
        id: 2,
        productId: 1,
        productCode: "QR_CREATE",
        productName: "QR",
        purchaseId: 11,
        totalQuantity: 30,
        remainingQuantity: 30,
        usedQuantity: 0,
        unlimited: false,
        usable: true,
        expired: false,
      },
    ];

    const usage = aggregatePackageUsage(entitlements, purchases);

    expect(usage.remaining).toBe(97);
    expect(usage.used).toBe(3);
    expect(usage.total).toBe(100);
    expect(usage.packageName).toBe("Ultimate");
  });
});
