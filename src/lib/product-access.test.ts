import { describe, expect, it } from "vitest";

import {
  hasActiveProductAccess,
  hasActivePackageProduct,
  hasExpiredProductAccess,
  packageIncludesProduct,
  pickActivePurchase,
  type ProductAccessEntitlement,
  type ProductAccessPurchase,
} from "./product-access";

function entitlement(overrides: Partial<ProductAccessEntitlement> = {}): ProductAccessEntitlement {
  return {
    productCode: "QR_MENU",
    purchaseId: 10,
    usable: true,
    expired: false,
    startsAt: "2026-01-01T00:00:00",
    expiresAt: "2099-01-01T00:00:00",
    purchaseStatus: "ACTIVE",
    ...overrides,
  };
}

function purchase(overrides: Partial<ProductAccessPurchase> = {}): ProductAccessPurchase {
  return {
    id: 10,
    usable: true,
    expired: false,
    expiresAt: "2099-01-01T00:00:00",
    status: "ACTIVE",
    ...overrides,
  };
}

describe("hasActiveProductAccess", () => {
  it("returns true for usable non-expired QR_MENU entitlement with usable purchase", () => {
    expect(hasActiveProductAccess([entitlement()], [purchase()], "QR_MENU")).toBe(true);
  });

  it("returns false when entitlement usable flag is false", () => {
    expect(hasActiveProductAccess([entitlement({ usable: false })], [purchase()], "QR_MENU")).toBe(false);
  });

  it("returns false when entitlement is expired", () => {
    expect(
      hasActiveProductAccess(
        [entitlement({ expired: true, usable: false, expiresAt: "2020-01-01T00:00:00" })],
        [purchase({ expired: true, usable: false, expiresAt: "2020-01-01T00:00:00" })],
        "QR_MENU",
      ),
    ).toBe(false);
  });

  it("returns false when linked purchase is expired", () => {
    expect(
      hasActiveProductAccess(
        [entitlement()],
        [purchase({ expired: true, usable: false, status: "EXPIRED", expiresAt: "2020-01-01T00:00:00" })],
        "QR_MENU",
      ),
    ).toBe(false);
  });

  it("trusts backend usable entitlement even if purchase.usable is false but not expired", () => {
    expect(
      hasActiveProductAccess(
        [entitlement({ usable: true, expired: false })],
        [purchase({ usable: false, expired: false, expiresAt: "2099-01-01T00:00:00" })],
        "QR_MENU",
      ),
    ).toBe(true);
  });

  it("accepts SMART_REPORTING as alias for QR_ANALYTICS", () => {
    expect(
      hasActiveProductAccess(
        [entitlement({ productCode: "SMART_REPORTING" })],
        [purchase()],
        "QR_ANALYTICS",
      ),
    ).toBe(true);
  });
});

describe("packageIncludesProduct", () => {
  it("returns true when package items include the product", () => {
    expect(
      packageIncludesProduct(
        { code: "PRO_PACKAGE", items: [{ productCode: "SMART_REPORTING" }] },
        "SMART_REPORTING",
      ),
    ).toBe(true);
  });

  it("returns false when package items omit the product", () => {
    expect(
      packageIncludesProduct(
        { code: "STARTER_PACKAGE", items: [{ productCode: "QR_MENU" }] },
        "SMART_REPORTING",
      ),
    ).toBe(false);
  });
});

describe("hasActivePackageProduct", () => {
  it("checks active purchase package items in catalog", () => {
    expect(
      hasActivePackageProduct(
        {
          id: 1,
          usable: true,
          expired: false,
          packageCode: "PRO_PACKAGE",
        },
        [{ code: "PRO_PACKAGE", items: [{ productCode: "SMART_REPORTING" }] }],
        "SMART_REPORTING",
      ),
    ).toBe(true);
  });
});

describe("pickActivePurchase", () => {
  it("prefers TRIAL over FREE when both are usable", () => {
    const selected = pickActivePurchase([
      {
        id: 1,
        usable: true,
        expired: false,
        expiresAt: "2099-01-01T00:00:00",
        purchaseType: "FREE",
        packageCode: "FREE_PACKAGE",
      },
      {
        id: 2,
        usable: true,
        expired: false,
        expiresAt: "2099-02-01T00:00:00",
        purchaseType: "TRIAL",
        packageCode: "PRO_PACKAGE",
      },
    ]);
    expect(selected?.id).toBe(2);
  });
  it("prefers PAID over ADD_ON even when addon packageCode looks paid", () => {
    const selected = pickActivePurchase([
      purchase({
        id: 1,
        purchaseType: "ADD_ON",
        packageCode: "QR_MENU",
      }),
      purchase({
        id: 2,
        purchaseType: "PAID",
        packageCode: "PRO_PACKAGE",
      }),
    ]);
    expect(selected?.id).toBe(2);
  });
});

describe("hasExpiredProductAccess", () => {
  it("returns true when user had QR_MENU but it is no longer usable", () => {
    expect(
      hasExpiredProductAccess(
        [entitlement({ usable: false, expired: true, expiresAt: "2020-01-01T00:00:00" })],
        [purchase({ usable: false, expired: true, expiresAt: "2020-01-01T00:00:00" })],
        "QR_MENU",
      ),
    ).toBe(true);
  });

  it("returns false when access is still active", () => {
    expect(hasExpiredProductAccess([entitlement()], [purchase()], "QR_MENU")).toBe(false);
  });

  it("returns false when user never had the product", () => {
    expect(hasExpiredProductAccess([], [], "QR_MENU")).toBe(false);
  });
});
