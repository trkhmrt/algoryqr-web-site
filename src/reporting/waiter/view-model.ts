import type { MenuWaiterPerformanceReportResponse } from "@/lib/api";

import type { ReportingKpiCard } from "../types";
import {
  WAITER_PERFORMANCE_METHODS,
  activeWaiterCount,
  assignedOrderCount,
  isWaiterPerformanceReportEmpty,
  unassignedOrderCount,
  waiterPerformanceAverageBasket,
  waiterPerformanceOrderCount,
  waiterPerformanceRevenue,
  waiterPerformanceTotalRevenue,
  type WaiterPerformanceKpiId,
} from "./methods";

export type WaiterPerformanceRowView = {
  key: string;
  waiterId: number | null;
  displayName: string;
  orderCount: number;
  revenue: number;
  avgOrderValue: number;
  revenueSharePercent: number;
  orderSharePercent: number;
  active: boolean;
  unassigned: boolean;
};

export type WaiterPerformanceChartPoint = {
  name: string;
  revenue: number;
  orderCount: number;
};

export type WaiterPerformanceReportView = {
  currency: string;
  empty: boolean;
  kpis: ReportingKpiCard<WaiterPerformanceKpiId>[];
  rows: WaiterPerformanceRowView[];
  chartData: WaiterPerformanceChartPoint[];
};

function kpi(id: WaiterPerformanceKpiId, value: number): ReportingKpiCard<WaiterPerformanceKpiId> {
  const def = WAITER_PERFORMANCE_METHODS[id];
  const display =
    def.unit === "money" ? String(value) : value.toLocaleString("tr-TR");
  return { ...def, value, display };
}

export function buildWaiterPerformanceReportView(
  report: MenuWaiterPerformanceReportResponse,
): WaiterPerformanceReportView {
  const currency = report.kpis.currency || "TRY";
  const revenue = waiterPerformanceTotalRevenue(report.kpis.totalRevenue);
  const assigned = assignedOrderCount(report.kpis.assignedOrderCount);
  const unassigned = unassignedOrderCount(report.kpis.unassignedOrderCount);
  const active = activeWaiterCount(report.kpis.activeWaiterCount);
  const totalOrders = assigned + unassigned;

  const rows: WaiterPerformanceRowView[] = (report.waiters ?? []).map((row) => {
    const orderCount = waiterPerformanceOrderCount(row.orderCount);
    const rowRevenue = waiterPerformanceRevenue(row.revenue);
    return {
      key: row.waiterId != null ? String(row.waiterId) : "unassigned",
      waiterId: row.waiterId ?? null,
      displayName: row.displayName,
      orderCount,
      revenue: rowRevenue,
      avgOrderValue: waiterPerformanceAverageBasket(rowRevenue, orderCount),
      revenueSharePercent: row.revenueSharePercent ?? 0,
      orderSharePercent: row.orderSharePercent ?? 0,
      active: row.active ?? true,
      unassigned: row.waiterId == null,
    };
  });

  const chartData = rows
    .filter((row) => row.orderCount > 0)
    .slice(0, 8)
    .map((row) => ({
      name: row.displayName,
      revenue: row.revenue,
      orderCount: row.orderCount,
    }));

  return {
    currency,
    empty: isWaiterPerformanceReportEmpty(totalOrders, revenue, rows.length),
    kpis: [
      kpi("activeWaiterCount", active),
      kpi("assignedOrderCount", assigned),
      kpi("unassignedOrderCount", unassigned),
      kpi("totalRevenue", revenue),
    ],
    rows,
    chartData,
  };
}
