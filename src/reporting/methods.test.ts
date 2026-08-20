import { describe, expect, it } from "vitest";

import { averageBasket, leastSoldByQuantity, lineRevenueShare, isRevenueReportEmpty, periodStarByQuantity, periodStarByRevenue } from "./revenue/methods";
import { buildRevenueReportView } from "./revenue/view-model";
import {
  averageProductsPerSession,
  deviceSharePercent,
  formatAverageProductsPerSession,
  isVisitReportEmpty,
} from "./visits/methods";
import { buildVisitReportView } from "./visits/view-model";
import type { MenuAnalyticsReportResponse, MenuRevenueReportResponse, MenuWaiterPerformanceReportResponse } from "@/lib/api";
import { buildWaiterPerformanceReportView, filterWaiterPerformanceReportView } from "./waiter/view-model";

describe("revenue methods", () => {
  it("averageBasket_dividesRevenueByOrders", () => {
    expect(averageBasket(557.5, 5)).toBe(111.5);
  });

  it("averageBasket_whenNoOrders_thenZero", () => {
    expect(averageBasket(100, 0)).toBe(0);
  });

  it("lineRevenueShare_isPercentOfTotal", () => {
    expect(lineRevenueShare(25, 100)).toBe(25);
    expect(lineRevenueShare(10, 0)).toBe(0);
  });

  it("isRevenueReportEmpty_whenNoSales", () => {
    expect(isRevenueReportEmpty(0, 0)).toBe(true);
    expect(isRevenueReportEmpty(1, 0)).toBe(false);
  });

  it("spotlightMethods_splitQuantityAndRevenueLeaders", () => {
    const products = [
      { productId: 1, name: "Ayran", quantity: 10, revenue: 50 },
      { productId: 2, name: "Izgara", quantity: 2, revenue: 200 },
      { productId: 3, name: "Cay", quantity: 1, revenue: 10 },
    ];
    expect(periodStarByQuantity(products)?.name).toBe("Ayran");
    expect(periodStarByRevenue(products)?.name).toBe("Izgara");
    expect(leastSoldByQuantity(products)?.name).toBe("Cay");
  });
});

describe("visit methods", () => {
  it("averageProductsPerSession_formatsOneDecimal", () => {
    expect(formatAverageProductsPerSession(averageProductsPerSession(2.36))).toBe("2.4");
  });

  it("deviceSharePercent_roundsToWholePercent", () => {
    expect(deviceSharePercent(1, 3)).toBe(33);
    expect(deviceSharePercent(2, 3)).toBe(67);
    expect(deviceSharePercent(1, 0)).toBe(0);
  });

  it("isVisitReportEmpty_whenNoTraffic", () => {
    expect(isVisitReportEmpty(0, 0)).toBe(true);
    expect(isVisitReportEmpty(0, 2)).toBe(false);
  });
});

describe("view models", () => {
  it("buildRevenueReportView_usesAverageBasketMethod", () => {
    const report: MenuRevenueReportResponse = {
      menuId: 1,
      from: "2026-08-01",
      to: "2026-08-13",
      kpis: { totalRevenue: 557.5, orderCount: 5, itemCount: 12, avgOrderValue: 99, currency: "TRY" },
      daily: [{ date: "2026-08-13", revenue: 557.5, orderCount: 5 }],
      products: [{ productId: 9, name: "Lahmacun", quantity: 4, revenue: 200 }],
      categories: [{ categoryId: 2, name: "Pideler", quantity: 4, revenue: 200 }],
    };

    const view = buildRevenueReportView(report);
    const basket = view.kpis.find((row) => row.id === "averageBasket");
    expect(basket?.method).toBe("averageBasket");
    expect(basket?.value).toBe(111.5);
    expect(view.products[0].share).toBeCloseTo((200 / 557.5) * 100);
  });

  it("buildRevenueReportView_usesQuantityLeaderAsGununUrunuOnSingleDay", () => {
    const report: MenuRevenueReportResponse = {
      menuId: 1,
      from: "2026-08-13",
      to: "2026-08-13",
      kpis: { totalRevenue: 260, orderCount: 1, itemCount: 13, avgOrderValue: 260, currency: "TRY" },
      daily: [],
      products: [
        { productId: 1, name: "Ayran", quantity: 10, revenue: 50 },
        { productId: 2, name: "Izgara", quantity: 2, revenue: 200 },
        { productId: 3, name: "Cay", quantity: 1, revenue: 10 },
      ],
      categories: [],
      unsold: { count: 1, products: [{ productId: 4, name: "Salata" }] },
      hourly: [{ hour: 14, revenue: 260, orderCount: 1 }],
    };

    const view = buildRevenueReportView(report);
    expect(view.singleDay).toBe(true);
    expect(view.spotlight.byQuantity.label).toBe("Günün ürünü");
    expect(view.spotlight.byQuantity.method).toBe("periodStarByQuantity");
    expect(view.spotlight.byQuantity.product?.name).toBe("Ayran");
    expect(view.spotlight.byRevenue.product?.name).toBe("Izgara");
    expect(view.spotlight.leastSold.product?.name).toBe("Cay");
    expect(view.spotlight.unsold.value).toBe(1);
    expect(view.productsByQuantityAsc[0].name).toBe("Cay");
    expect(view.hourly).toHaveLength(1);
    expect(view.hourly[0]).toMatchObject({ hour: "14", orderCount: 1, revenue: 260 });
  });

  it("buildRevenueReportView_usesPeriodStarLabelOnMultiDay", () => {
    const report: MenuRevenueReportResponse = {
      menuId: 1,
      from: "2026-08-07",
      to: "2026-08-13",
      kpis: { totalRevenue: 50, orderCount: 1, itemCount: 10, avgOrderValue: 50, currency: "TRY" },
      daily: [],
      products: [{ productId: 1, name: "Ayran", quantity: 10, revenue: 50 }],
      categories: [],
    };

    const view = buildRevenueReportView(report);
    expect(view.singleDay).toBe(false);
    expect(view.spotlight.byQuantity.label).toBe("En çok satılan");
    expect(view.hourly).toHaveLength(24);
  });

  it("buildVisitReportView_mapsKpisToMethods", () => {
    const report = {
      menuId: 1,
      menuName: "Test",
      from: "2026-08-01",
      to: "2026-08-13",
      kpis: { sessions: 10, menuOpens: 12, productViews: 24, categoryViews: 18, avgProductsPerSession: 2.4 },
      daily: [],
      hourly: [{ hour: 9, views: 4 }],
      devices: [
        { name: "Mobil", value: 7 },
        { name: "Tablet", value: 1 },
        { name: "Masaustu", value: 2 },
      ],
      topProducts: [{ productId: 1, name: "A", views: 5 }],
      topCategories: [{ categoryId: 1, name: "B", views: 3 }],
      categoryProductTree: [],
      sampleJourneys: [],
      funnel: { menuOpens: 12, categoryViews: 18, productViews: 24 },
    } satisfies MenuAnalyticsReportResponse;

    const view = buildVisitReportView(report);
    expect(view.kpis.map((row) => row.method)).toEqual([
      "sessionCount",
      "menuOpenCount",
      "productViewCount",
      "averageProductsPerSession",
    ]);
    expect(view.hourly[0]).toEqual({ hour: "09", views: 4 });
    expect(view.devices[0].pct).toBe(70);
    expect(view.funnel[1].method).toBe("categoryViewCount");
  });

  it("buildWaiterPerformanceReportView_mapsDetailedPersonnelMetrics", () => {
    const report: MenuWaiterPerformanceReportResponse = {
      menuId: 1,
      from: "2026-08-01",
      to: "2026-08-13",
      kpis: {
        activeWaiterCount: 2,
        assignedOrderCount: 2,
        unassignedOrderCount: 1,
        totalRevenue: 260,
        itemCount: 4,
        totalCommission: 24,
        totalTip: 10,
        billsClosedCount: 1,
        currency: "TRY",
      },
      waiters: [
        {
          waiterId: 101,
          displayName: "Ali",
          orderCount: 1,
          itemCount: 2,
          revenue: 150,
          tipAmount: 10,
          commissionAmount: 15,
          billsClosedCount: 1,
          revenueSharePercent: 57.7,
          orderSharePercent: 33.3,
          itemSharePercent: 50,
          active: true,
          topProducts: [{ productId: 11, name: "Cay", quantity: 2, revenue: 150 }],
        },
      ],
      daily: [{ date: "2026-08-13", revenue: 260, orderCount: 3 }],
      hourly: [{ hour: 14, revenue: 260, orderCount: 3 }],
      products: [{ productId: 11, name: "Cay", quantity: 4, revenue: 260 }],
    };

    const view = buildWaiterPerformanceReportView(report);
    expect(view.kpis.find((row) => row.id === "soldItemCount")?.value).toBe(4);
    expect(view.kpis.find((row) => row.id === "totalCommission")?.value).toBe(24);
    expect(view.kpis.find((row) => row.id === "totalTip")?.value).toBe(10);
    expect(view.rows[0].itemCount).toBe(2);
    expect(view.rows[0].tipAmount).toBe(10);
    expect(view.rows[0].topProducts[0].name).toBe("Cay");
    expect(view.products).toHaveLength(1);
    expect(view.daily).toHaveLength(1);
    expect(view.hourly).toHaveLength(1);
  });

  it("filterWaiterPerformanceReportView_whenWaiterSelected_thenScopesMetrics", () => {
    const report: MenuWaiterPerformanceReportResponse = {
      menuId: 1,
      from: "2026-08-01",
      to: "2026-08-13",
      kpis: {
        activeWaiterCount: 2,
        assignedOrderCount: 2,
        unassignedOrderCount: 0,
        totalRevenue: 260,
        itemCount: 4,
        totalCommission: 24,
        billsClosedCount: 1,
        currency: "TRY",
      },
      waiters: [
        {
          waiterId: 101,
          displayName: "Ali",
          orderCount: 1,
          itemCount: 2,
          revenue: 150,
          commissionAmount: 15,
          billsClosedCount: 1,
          revenueSharePercent: 57.7,
          orderSharePercent: 50,
          itemSharePercent: 50,
          active: true,
          topProducts: [{ productId: 11, name: "Cay", quantity: 2, revenue: 150 }],
        },
        {
          waiterId: 102,
          displayName: "Ayse",
          orderCount: 1,
          itemCount: 2,
          revenue: 110,
          commissionAmount: 9,
          billsClosedCount: 0,
          revenueSharePercent: 42.3,
          orderSharePercent: 50,
          itemSharePercent: 50,
          active: true,
          topProducts: [{ productId: 12, name: "Ayran", quantity: 2, revenue: 110 }],
        },
      ],
      daily: [{ date: "2026-08-13", revenue: 260, orderCount: 2 }],
      hourly: [{ hour: 14, revenue: 260, orderCount: 2 }],
      products: [{ productId: 11, name: "Cay", quantity: 4, revenue: 260 }],
    };

    const view = buildWaiterPerformanceReportView(report);
    const filtered = filterWaiterPerformanceReportView(view, "101");
    expect(filtered.rows).toHaveLength(1);
    expect(filtered.rows[0].displayName).toBe("Ali");
    expect(filtered.kpis.find((row) => row.id === "totalRevenue")?.value).toBe(150);
    expect(filtered.kpis.find((row) => row.id === "soldItemCount")?.value).toBe(2);
    expect(filtered.products[0].name).toBe("Cay");
    expect(filtered.daily).toHaveLength(0);
    expect(filtered.hourly).toHaveLength(0);
  });
});
