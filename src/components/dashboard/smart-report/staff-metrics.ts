import type { MenuWaiterPerformanceReportResponse } from "@/lib/api";
import { revenueShare, roundMoney, toAmount } from "@/reporting/numbers";

export type StaffLoadRow = {
  name: string;
  revenueShare: number;
  orderShare: number;
  gap: number;
};

export type StaffCompare = {
  load: StaffLoadRow[];
  teamItems: number;
  avgItemRevenue: number;
  totalTip: number;
  totalRevenue: number;
  activeHours: number;
  revenuePerHour: number;
};

function divideRevenue(revenue: number, units: number): number {
  if (units <= 0) return 0;
  return roundMoney(revenue / units);
}

function countActiveSlots(
  rows: { revenue?: number | string | null; orderCount?: number }[],
): number {
  return rows.filter((row) => toAmount(row.revenue) > 0 || (row.orderCount ?? 0) > 0).length;
}

function operatingHours(
  hourly: { revenue?: number | string | null; orderCount?: number }[],
  daily: { revenue?: number | string | null; orderCount?: number }[],
): number {
  const hoursPerDay = countActiveSlots(hourly);
  if (hoursPerDay <= 0) return 0;
  const days = countActiveSlots(daily);
  return (days > 0 ? days : 1) * hoursPerDay;
}

function loadRows(
  waiters: MenuWaiterPerformanceReportResponse["waiters"],
  totalRevenue: number,
): StaffLoadRow[] {
  return waiters
    .map((row) => {
      const revenueSharePct = row.revenueSharePercent ?? revenueShare(toAmount(row.revenue), totalRevenue);
      const orderSharePct = row.orderSharePercent ?? 0;
      return {
        name: row.displayName,
        revenueShare: revenueSharePct,
        orderShare: orderSharePct,
        gap: revenueSharePct - orderSharePct,
      };
    })
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
}

export function readStaffCompare(waiter: MenuWaiterPerformanceReportResponse): StaffCompare {
  const waiters = waiter.waiters ?? [];
  const kpis = waiter.kpis ?? {};
  const totalRevenue = toAmount(kpis.totalRevenue) || waiters.reduce((sum, row) => sum + toAmount(row.revenue), 0);
  const totalTip = toAmount(kpis.totalTip) || waiters.reduce((sum, row) => sum + toAmount(row.tipAmount), 0);
  const fromWaiters = waiters.reduce((sum, row) => sum + (row.itemCount ?? 0), 0);
  const teamItems = kpis.itemCount ?? fromWaiters;
  const activeHours = operatingHours(waiter.hourly ?? [], waiter.daily ?? []);
  return {
    load: loadRows(waiters, totalRevenue),
    teamItems,
    avgItemRevenue: divideRevenue(totalRevenue, teamItems),
    totalTip,
    totalRevenue,
    activeHours,
    revenuePerHour: divideRevenue(totalRevenue, activeHours),
  };
}

export function filterStaffReport(
  report: MenuWaiterPerformanceReportResponse,
  waiterId: number | null,
): MenuWaiterPerformanceReportResponse {
  if (waiterId == null) return report;
  const row = (report.waiters ?? []).find((item) => item.waiterId === waiterId);
  if (!row) {
    return { ...report, waiters: [], daily: [], hourly: [], kpis: { ...report.kpis, totalRevenue: 0, totalTip: 0, itemCount: 0, billsClosedCount: 0 } };
  }
  return {
    ...report,
    waiters: [
      {
        ...row,
        revenueSharePercent: 100,
        orderSharePercent: 100,
      },
    ],
    daily: [],
    hourly: [],
    kpis: {
      ...report.kpis,
      totalRevenue: row.revenue,
      totalTip: row.tipAmount,
      itemCount: row.itemCount,
      billsClosedCount: row.billsClosedCount || row.orderCount,
    },
  };
}
