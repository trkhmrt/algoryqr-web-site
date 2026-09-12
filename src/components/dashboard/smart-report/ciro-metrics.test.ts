import { describe, expect, it } from "vitest";

import type { MenuRevenueReportResponse } from "@/lib/api";

import { fillHourlyPoints, readChannelMix, readCiroMetrics, readProfitMix, readSoldMix, readVolumeValue } from "./ciro-metrics";

function report(partial: Partial<MenuRevenueReportResponse>): MenuRevenueReportResponse {
  return {
    from: "2026-09-01",
    to: "2026-09-12",
    kpis: { totalRevenue: 0, orderCount: 0, itemCount: 0 },
    daily: [],
    products: [],
    categories: [],
    ...partial,
  };
}

describe("readCiroMetrics", () => {
  it("fallsBackToDailySumWhenKpisAreZero", () => {
    const metrics = readCiroMetrics(
      report({
        daily: [
          { date: "2026-09-11", revenue: "120.50", orderCount: 2 },
          { date: "2026-09-12", revenue: 80, orderCount: 1 },
        ],
        paymentBreakdown: { cashRevenue: 70, cardRevenue: 130 },
      }),
    );
    expect(metrics.total).toBe(200.5);
    expect(metrics.cash).toBe(70);
    expect(metrics.card).toBe(130);
    expect(metrics.cardShare).toBe(65);
    expect(metrics.cashShare).toBe(35);
  });

  it("usesGrossWhenKpisMissing", () => {
    const metrics = readCiroMetrics(
      report({
        kpis: { currency: "TRY" },
        paymentBreakdown: { grossRevenue: "400", cashRevenue: "100", cardRevenue: "300" },
      }),
    );
    expect(metrics.total).toBe(400);
    expect(metrics.cardShare).toBe(75);
  });

  it("readChannelMix_alwaysShowsInHouseUberAndYemeksepeti", () => {
    const metrics = readCiroMetrics(
      report({
        paymentBreakdown: { cashRevenue: 800, cardRevenue: 65, uberEatsRevenue: 200 },
      }),
    );
    const mix = readChannelMix(report({}), metrics);
    expect(mix.rows.map((row) => row.code)).toEqual(["IN_HOUSE", "UBER_EATS", "YEMEK_SEPETI"]);
    expect(mix.rows.find((row) => row.code === "IN_HOUSE")?.revenue).toBe(865);
    expect(mix.rows.find((row) => row.code === "UBER_EATS")?.revenue).toBe(200);
    expect(mix.rows.find((row) => row.code === "YEMEK_SEPETI")?.revenue).toBe(0);
  });

  it("readChannelMix_prefersApiChannelRows", () => {
    const source = report({
      paymentBreakdown: { cashRevenue: 100, cardRevenue: 0, uberEatsRevenue: 0 },
      channels: [
        {
          code: "IN_HOUSE",
          label: "Masa / QR",
          revenue: 500,
          orderCount: 4,
          connected: true,
        },
        {
          code: "UBER_EATS",
          label: "Uber Eats",
          revenue: 250,
          orderCount: 3,
          connected: true,
        },
      ],
    });
    const mix = readChannelMix(source, readCiroMetrics(source));
    expect(mix.rows.find((row) => row.code === "IN_HOUSE")).toMatchObject({
      label: "İç satış",
      revenue: 500,
      orders: 4,
    });
    expect(mix.rows.find((row) => row.code === "UBER_EATS")?.revenue).toBe(250);
    expect(mix.total).toBe(750);
  });

  it("readSoldMix_sortsProductsAndCategoriesByQuantity", () => {
    const mix = readSoldMix(
      report({
        kpis: { itemCount: 3 },
        products: [
          { productId: 1, name: "Ayran", quantity: 10, revenue: 50 },
          { productId: 2, name: "Lahmacun", quantity: 4, revenue: 200 },
        ],
        categories: [
          { name: "Pideler", quantity: 4, revenue: 200 },
          { name: "İçecek", quantity: 10, revenue: 50 },
        ],
      }),
    );
    expect(mix.itemCount).toBe(14);
    expect(mix.products[0].name).toBe("Ayran");
    expect(mix.categories[0].name).toBe("İçecek");
  });

  it("readVolumeValue_splitsQuantityAndRevenueLeaders", () => {
    const mix = readVolumeValue(
      report({
        products: [
          { productId: 1, name: "Ayran", quantity: 10, revenue: 50 },
          { productId: 2, name: "Izgara", quantity: 2, revenue: 200 },
          { productId: 3, name: "Çay", quantity: 1, revenue: 10 },
        ],
        spotlight: { leastSoldByQuantity: { productId: 3, name: "Çay", quantity: 1, revenue: 10 } },
        unsold: { count: 4, products: [] },
      }),
    );
    expect(mix.byQuantity[0].name).toBe("Ayran");
    expect(mix.byRevenue[0].name).toBe("Izgara");
    expect(mix.leastSold?.name).toBe("Çay");
    expect(mix.unsoldCount).toBe(4);
  });

  it("readProfitMix_usesNetOverGross", () => {
    const source = report({
      paymentBreakdown: { grossRevenue: 1000, fixedExpenseTotal: 250, netRevenue: 750 },
    });
    const mix = readProfitMix(source, readCiroMetrics(source));
    expect(mix.expenseShare).toBe(25);
    expect(mix.netShare).toBe(75);
  });

  it("fillHourlyPoints_padsMissingHours", () => {
    const points = fillHourlyPoints([
      { hour: 12, revenue: 80 },
      { hour: 19, revenue: 220 },
    ]);
    expect(points).toHaveLength(24);
    expect(points[12]?.revenue).toBe(80);
    expect(points[19]?.revenue).toBe(220);
    expect(points[0]?.revenue).toBe(0);
  });
});
