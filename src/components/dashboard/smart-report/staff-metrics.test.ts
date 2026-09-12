import { describe, expect, it } from "vitest";

import type { MenuWaiterPerformanceReportResponse } from "@/lib/api";

import { filterStaffReport, readStaffCompare } from "./staff-metrics";

function waiterReport(
  partial: Partial<MenuWaiterPerformanceReportResponse>,
): MenuWaiterPerformanceReportResponse {
  return {
    from: "2026-09-01",
    to: "2026-09-12",
    kpis: {},
    waiters: [],
    ...partial,
  };
}

describe("readStaffCompare", () => {
  it("ranksLoadByRevenueMinusOrderShare", () => {
    const mix = readStaffCompare(
      waiterReport({
        kpis: { totalRevenue: 1000, totalTip: 50, itemCount: 20, billsClosedCount: 10 },
        waiters: [
          {
            displayName: "Ayşe",
            revenue: 700,
            orderCount: 4,
            billsClosedCount: 4,
            itemCount: 12,
            tipAmount: 40,
            avgOrderValue: 175,
            revenueSharePercent: 70,
            orderSharePercent: 40,
          },
          {
            displayName: "Ali",
            revenue: 300,
            orderCount: 6,
            billsClosedCount: 6,
            itemCount: 8,
            tipAmount: 10,
            avgOrderValue: 50,
            revenueSharePercent: 30,
            orderSharePercent: 60,
          },
        ],
      }),
    );
    expect(mix.load[0].name).toBe("Ayşe");
    expect(mix.load[0].gap).toBe(30);
    expect(mix.teamItems).toBe(20);
    expect(mix.avgItemRevenue).toBe(50);
    expect(mix.activeHours).toBe(0);
    expect(mix.revenuePerHour).toBe(0);
  });

  it("doesNotUseUnassignedOrderCount", () => {
    const source = readStaffCompare.toString();
    expect(source).not.toContain("unassignedOrderCount");
  });

  it("filterStaffReport_keepsSingleWaiter", () => {
    const filtered = filterStaffReport(
      waiterReport({
        kpis: { totalRevenue: 1000, totalTip: 50, itemCount: 20, billsClosedCount: 10 },
        waiters: [
          { waiterId: 1, displayName: "Ayşe", revenue: 700, tipAmount: 40, itemCount: 12, billsClosedCount: 4 },
          { waiterId: 2, displayName: "Ali", revenue: 300, tipAmount: 10, itemCount: 8, billsClosedCount: 6 },
        ],
        daily: [{ date: "2026-09-11", revenue: 100, orderCount: 2 }],
      }),
      1,
    );
    expect(filtered.waiters).toHaveLength(1);
    expect(filtered.waiters[0].displayName).toBe("Ayşe");
    expect(filtered.kpis.totalRevenue).toBe(700);
    expect(filtered.kpis.itemCount).toBe(12);
    expect(readStaffCompare(filtered).teamItems).toBe(12);
    expect(readStaffCompare(filtered).avgItemRevenue).toBe(58.33);
    expect(filtered.daily).toEqual([]);
  });

  it("readStaffCompare_whenNoItems_thenAvgItemRevenueZero", () => {
    const mix = readStaffCompare(
      waiterReport({
        kpis: { totalRevenue: 865, itemCount: 0 },
      }),
    );
    expect(mix.avgItemRevenue).toBe(0);
  });

  it("readStaffCompare_whenItemsSold_thenAvgIsRevenuePerItem", () => {
    const mix = readStaffCompare(
      waiterReport({
        kpis: { totalRevenue: 865, itemCount: 4 },
      }),
    );
    expect(mix.avgItemRevenue).toBe(216.25);
  });

  it("readStaffCompare_whenHourlySales_thenRevenuePerHour", () => {
    const mix = readStaffCompare(
      waiterReport({
        kpis: { totalRevenue: 9920 },
        daily: [{ date: "2026-09-11", revenue: 9920, orderCount: 20 }],
        hourly: [
          { hour: 12, revenue: 2480, orderCount: 5 },
          { hour: 13, revenue: 2480, orderCount: 5 },
          { hour: 14, revenue: 2480, orderCount: 5 },
          { hour: 15, revenue: 2480, orderCount: 5 },
          { hour: 16, revenue: 0, orderCount: 0 },
        ],
      }),
    );
    expect(mix.activeHours).toBe(4);
    expect(mix.revenuePerHour).toBe(2480);
  });

  it("readStaffCompare_whenMultiDayHourly_thenHoursAreDaysTimesSlots", () => {
    const mix = readStaffCompare(
      waiterReport({
        kpis: { totalRevenue: 9920 },
        daily: [
          { date: "2026-09-11", revenue: 4960, orderCount: 10 },
          { date: "2026-09-12", revenue: 4960, orderCount: 10 },
        ],
        hourly: [
          { hour: 12, revenue: 2480, orderCount: 5 },
          { hour: 13, revenue: 2480, orderCount: 5 },
          { hour: 14, revenue: 2480, orderCount: 5 },
          { hour: 15, revenue: 2480, orderCount: 5 },
        ],
      }),
    );
    expect(mix.activeHours).toBe(8);
    expect(mix.revenuePerHour).toBe(1240);
  });

  it("readStaffCompare_whenNoHourlySales_thenRevenuePerHourZero", () => {
    const mix = readStaffCompare(
      waiterReport({
        kpis: { totalRevenue: 9920 },
        daily: [{ date: "2026-09-11", revenue: 9920, orderCount: 20 }],
        hourly: [{ hour: 12, revenue: 0, orderCount: 0 }],
      }),
    );
    expect(mix.activeHours).toBe(0);
    expect(mix.revenuePerHour).toBe(0);
  });
});
