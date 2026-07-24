import { describe, expect, it } from "vitest";

import type { PlanPackageApiItem } from "./api";
import {
  buildPackageComparisonRows,
  diffPackages,
  planActionLabel,
} from "./package-display";

function pkg(overrides: Partial<PlanPackageApiItem> & { id: number; code: string; name: string }): PlanPackageApiItem {
  return {
    description: "",
    price: 0,
    currency: "TRY",
    active: true,
    validityDays: 30,
    items: [],
    ...overrides,
  };
}

describe("buildPackageComparisonRows", () => {
  it("builds rows for qr menu and price", () => {
    const packages = [
      pkg({
        id: 1,
        code: "FREE_PACKAGE",
        name: "Free",
        price: 0,
        items: [{ id: 1, productCode: "QR_CREATE", productName: "QR", quantity: 3, unlimited: false }],
      }),
      pkg({
        id: 2,
        code: "PRO_PACKAGE",
        name: "Pro",
        price: 199,
        trialEligible: true,
        items: [
          { id: 2, productCode: "QR_CREATE", productName: "QR", quantity: 30, unlimited: false },
          { id: 3, productCode: "QR_MENU", productName: "Menü", quantity: 1, unlimited: false },
        ],
      }),
    ];
    const rows = buildPackageComparisonRows(packages);
    expect(rows.find((r) => r.id === "qrMenu")?.values["2"]).toBe("Var");
    expect(rows.find((r) => r.id === "qrMenu")?.values["1"]).toBe("Yok");
    expect(rows.find((r) => r.id === "price")?.values["2"]).toContain("199");
  });
});

describe("diffPackages", () => {
  it("lists gained menu feature when upgrading free to pro", () => {
    const free = pkg({
      id: 1,
      code: "FREE_PACKAGE",
      name: "Free",
      price: 0,
      items: [{ id: 1, productCode: "QR_CREATE", productName: "QR", quantity: 3, unlimited: false }],
    });
    const pro = pkg({
      id: 2,
      code: "PRO_PACKAGE",
      name: "Pro",
      price: 199,
      items: [
        { id: 2, productCode: "QR_CREATE", productName: "QR", quantity: 30, unlimited: false },
        { id: 3, productCode: "QR_MENU", productName: "Menü", quantity: 1, unlimited: false },
      ],
    });
    const diff = diffPackages(free, pro);
    expect(diff.direction).toBe("upgrade");
    expect(diff.gained.some((f) => f.toLowerCase().includes("menü"))).toBe(true);
  });
});

describe("planActionLabel", () => {
  it("returns Mevcut plan for same package id", () => {
    expect(
      planActionLabel(2, pkg({ id: 2, code: "PRO_PACKAGE", name: "Pro", price: 199 }), 199),
    ).toBe("Mevcut plan");
  });

  it("returns Yükselt when target is more expensive", () => {
    expect(
      planActionLabel(1, pkg({ id: 2, code: "PRO_PACKAGE", name: "Pro", price: 199 }), 99),
    ).toBe("Yükselt");
  });
});
