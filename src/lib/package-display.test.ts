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
  it("builds fixed catalog product rows with quantities and presence", () => {
    const packages = [
      pkg({
        id: 1,
        code: "FREE_PACKAGE",
        name: "Free",
        price: 0,
        items: [{ id: 1, productCode: "QR_CREATE", productName: "QR", quantity: 5, unlimited: false }],
      }),
      pkg({
        id: 2,
        code: "PRO_PACKAGE",
        name: "Pro",
        price: 249,
        trialEligible: true,
        items: [
          { id: 2, productCode: "QR_CREATE", productName: "QR", quantity: 30, unlimited: false },
          { id: 3, productCode: "SMART_ASSISTANT", productName: "Akilli Asistan", quantity: 1, unlimited: true },
        ],
      }),
      pkg({
        id: 3,
        code: "ULTIMATE_PACKAGE",
        name: "Ultimate",
        price: 649,
        items: [
          { id: 4, productCode: "QR_CREATE", productName: "QR", quantity: 100, unlimited: false },
          { id: 5, productCode: "SMART_ASSISTANT", productName: "Akilli Asistan", quantity: 1, unlimited: true },
          { id: 6, productCode: "SMART_SUMMARY", productName: "Akilli Ozet", quantity: 1, unlimited: true },
          { id: 7, productCode: "SMART_REPORTING", productName: "Akilli Raporlama", quantity: 1, unlimited: true },
        ],
      }),
    ];
    const rows = buildPackageComparisonRows(packages);
    const productIds = rows.filter((r) => r.id.startsWith("product:")).map((r) => r.id);
    expect(productIds).toEqual([
      "product:QR_CREATE",
      "product:SMART_ASSISTANT",
      "product:SMART_SUMMARY",
      "product:SMART_REPORTING",
    ]);
    expect(rows.find((r) => r.id === "product:QR_CREATE")?.values["1"]).toBe("5 adet");
    expect(rows.find((r) => r.id === "product:QR_CREATE")?.values["2"]).toBe("30 adet");
    expect(rows.find((r) => r.id === "product:QR_CREATE")?.values["3"]).toBe("100 adet");
    expect(rows.find((r) => r.id === "product:SMART_ASSISTANT")?.values["2"]).toBe("Var");
    expect(rows.find((r) => r.id === "product:SMART_ASSISTANT")?.values["1"]).toBe("Yok");
    expect(rows.find((r) => r.id === "product:SMART_SUMMARY")?.values["3"]).toBe("Var");
    expect(rows.find((r) => r.id === "product:SMART_SUMMARY")?.values["2"]).toBe("Yok");
    expect(rows.find((r) => r.id === "product:SMART_REPORTING")?.values["3"]).toBe("Var");
    expect(rows.find((r) => r.id === "price")?.values["3"]).toContain("649");
    expect(rows.some((r) => r.id === "product:QR_MENU")).toBe(false);
  });

  it("merges legacy QR_AGENT into a single SMART_ASSISTANT row", () => {
    const packages = [
      pkg({
        id: 2,
        code: "PRO_PACKAGE",
        name: "Pro",
        price: 199,
        items: [
          { id: 1, productCode: "QR_CREATE", productName: "QR", quantity: 30, unlimited: false },
          { id: 2, productCode: "QR_AGENT", productName: "Akıllı asistan", quantity: 1, unlimited: true },
          { id: 3, productCode: "SMART_ASSISTANT", productName: "Akıllı Asistan", quantity: 1, unlimited: true },
          { id: 4, productCode: "QR_MENU", productName: "Menü", quantity: 1, unlimited: false },
        ],
      }),
      pkg({
        id: 3,
        code: "ULTIMATE_PACKAGE",
        name: "Ultimate",
        price: 649,
        items: [
          { id: 5, productCode: "QR_CREATE", productName: "QR", quantity: 100, unlimited: false },
          { id: 6, productCode: "SMART_ASSISTANT", productName: "Akıllı Asistan", quantity: 1, unlimited: true },
          { id: 7, productCode: "QR_ANALYTICS", productName: "Akıllı raporlama", quantity: 1, unlimited: true },
        ],
      }),
    ];
    const rows = buildPackageComparisonRows(packages);
    expect(rows.filter((r) => r.id.startsWith("product:")).map((r) => r.id)).toEqual([
      "product:QR_CREATE",
      "product:SMART_ASSISTANT",
      "product:SMART_SUMMARY",
      "product:SMART_REPORTING",
    ]);
    expect(rows.find((r) => r.id === "product:SMART_ASSISTANT")?.values["2"]).toBe("Var");
    expect(rows.find((r) => r.id === "product:SMART_ASSISTANT")?.values["3"]).toBe("Var");
    expect(rows.find((r) => r.id === "product:SMART_REPORTING")?.values["3"]).toBe("Var");
    expect(rows.find((r) => r.id === "product:SMART_REPORTING")?.values["2"]).toBe("Yok");
  });
});

describe("diffPackages", () => {
  it("lists gained menu feature when upgrading free to pro by priority", () => {
    const free = pkg({
      id: 1,
      code: "FREE_PACKAGE",
      name: "Free",
      price: 0,
      priority: 1,
      items: [{ id: 1, productCode: "QR_CREATE", productName: "QR", quantity: 3, unlimited: false }],
    });
    const pro = pkg({
      id: 2,
      code: "PRO_PACKAGE",
      name: "Pro",
      price: 199,
      priority: 100,
      items: [
        { id: 2, productCode: "QR_CREATE", productName: "QR", quantity: 30, unlimited: false },
        { id: 3, productCode: "QR_MENU", productName: "Menü", quantity: 1, unlimited: false },
      ],
    });
    const diff = diffPackages(free, pro);
    expect(diff.direction).toBe("upgrade");
    expect(diff.gained.some((f) => f.toLowerCase().includes("menü"))).toBe(true);
  });

  it("marks downgrade when target priority is lower", () => {
    const pro = pkg({
      id: 2,
      code: "PRO_PACKAGE",
      name: "Pro",
      price: 199,
      priority: 100,
      items: [{ id: 2, productCode: "QR_CREATE", productName: "QR", quantity: 30, unlimited: false }],
    });
    const free = pkg({
      id: 1,
      code: "FREE_PACKAGE",
      name: "Free",
      price: 0,
      priority: 1,
      items: [{ id: 1, productCode: "QR_CREATE", productName: "QR", quantity: 3, unlimited: false }],
    });
    expect(diffPackages(pro, free).direction).toBe("downgrade");
  });
});

describe("planActionLabel", () => {
  it("returns Mevcut plan for same package id when paid", () => {
    expect(
      planActionLabel(2, pkg({ id: 2, code: "PRO_PACKAGE", name: "Pro", price: 199 }), 199, "PAID"),
    ).toBe("Mevcut plan");
  });

  it("returns Satın al for same package id when trial", () => {
    expect(
      planActionLabel(2, pkg({ id: 2, code: "PRO_PACKAGE", name: "Pro", price: 199 }), 199, "TRIAL"),
    ).toBe("Satın al");
  });

  it("returns Yükselt when target is more expensive", () => {
    expect(
      planActionLabel(1, pkg({ id: 2, code: "PRO_PACKAGE", name: "Pro", price: 199 }), 99),
    ).toBe("Yükselt");
  });

  it("returns null for Free package when not current", () => {
    expect(
      planActionLabel(2, pkg({ id: 1, code: "FREE_PACKAGE", name: "Free", price: 0 }), 199, "PAID"),
    ).toBeNull();
  });
});
