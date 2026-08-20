import type { MenuWaiterPerformanceReportResponse } from "@/lib/api";

import { formatReportingDate } from "../period";
import type { ReportingKpiCard } from "../types";
import {
  WAITER_PERFORMANCE_METHODS,
  activeWaiterCount,
  assignedOrderCount,
  isWaiterPerformanceReportEmpty,
  unassignedOrderCount,
  waiterPerformanceAverageBasket,
  waiterPerformanceBillsClosedCount,
  waiterPerformanceCommission,
  waiterPerformanceItemCount,
  waiterPerformanceOrderCount,
  waiterPerformanceRevenue,
  waiterPerformanceSoldItemCount,
  waiterPerformanceTotalCommission,
  waiterPerformanceTotalRevenue,
  type WaiterPerformanceKpiId,
} from "./methods";

export type WaiterPerformanceRowView = {
  key: string;
  waiterId: number | null;
  displayName: string;
  orderCount: number;
  itemCount: number;
  revenue: number;
  commissionAmount: number;
  billsClosedCount: number;
  avgOrderValue: number;
  revenueSharePercent: number;
  orderSharePercent: number;
  itemSharePercent: number;
  active: boolean;
  unassigned: boolean;
  topProducts: WaiterProductRowView[];
};

export type WaiterProductRowView = {
  key: string;
  productId: number;
  name: string;
  quantity: number;
  revenue: number;
};

export type WaiterPerformanceChartPoint = {
  name: string;
  revenue: number;
  orderCount: number;
  itemCount: number;
};

export type WaiterDailyChartPoint = {
  dateLabel: string;
  revenue: number;
  orderCount: number;
};

export type WaiterHourlyChartPoint = {
  hour: string;
  hourValue: number;
  revenue: number;
  orderCount: number;
};

export type WaiterPerformanceReportView = {
  currency: string;
  empty: boolean;
  kpis: ReportingKpiCard<WaiterPerformanceKpiId>[];
  rows: WaiterPerformanceRowView[];
  chartData: WaiterPerformanceChartPoint[];
  daily: WaiterDailyChartPoint[];
  hourly: WaiterHourlyChartPoint[];
  products: WaiterProductRowView[];
};

function kpi(id: WaiterPerformanceKpiId, value: number): ReportingKpiCard<WaiterPerformanceKpiId> {
  const def = WAITER_PERFORMANCE_METHODS[id];
  const display =
    def.unit === "money" ? String(value) : value.toLocaleString("tr-TR");
  return { ...def, value, display };
}

function mapProductRow(
  product: { productId: number; name: string; quantity?: number; revenue?: number | string | null },
): WaiterProductRowView {
  return {
    key: String(product.productId),
    productId: product.productId,
    name: product.name,
    quantity: product.quantity ?? 0,
    revenue: waiterPerformanceRevenue(product.revenue),
  };
}

export function buildWaiterPerformanceReportView(
  report: MenuWaiterPerformanceReportResponse,
): WaiterPerformanceReportView {
  const currency = report.kpis.currency || "TRY";
  const revenue = waiterPerformanceTotalRevenue(report.kpis.totalRevenue);
  const assigned = assignedOrderCount(report.kpis.assignedOrderCount);
  const unassigned = unassignedOrderCount(report.kpis.unassignedOrderCount);
  const active = activeWaiterCount(report.kpis.activeWaiterCount);
  const soldItems = waiterPerformanceSoldItemCount(report.kpis.itemCount);
  const totalCommission = waiterPerformanceTotalCommission(report.kpis.totalCommission);
  const billsClosed = waiterPerformanceBillsClosedCount(report.kpis.billsClosedCount);
  const totalOrders = assigned + unassigned;

  const rows: WaiterPerformanceRowView[] = (report.waiters ?? []).map((row) => {
    const orderCount = waiterPerformanceOrderCount(row.orderCount);
    const itemCount = waiterPerformanceItemCount(row.itemCount);
    const rowRevenue = waiterPerformanceRevenue(row.revenue);
    return {
      key: row.waiterId != null ? String(row.waiterId) : "unassigned",
      waiterId: row.waiterId ?? null,
      displayName: row.displayName,
      orderCount,
      itemCount,
      revenue: rowRevenue,
      commissionAmount: waiterPerformanceCommission(row.commissionAmount),
      billsClosedCount: row.billsClosedCount ?? 0,
      avgOrderValue: waiterPerformanceAverageBasket(rowRevenue, orderCount),
      revenueSharePercent: row.revenueSharePercent ?? 0,
      orderSharePercent: row.orderSharePercent ?? 0,
      itemSharePercent: row.itemSharePercent ?? 0,
      active: row.active ?? true,
      unassigned: row.waiterId == null,
      topProducts: (row.topProducts ?? []).map(mapProductRow),
    };
  });

  const chartData = rows
    .filter((row) => row.orderCount > 0)
    .slice(0, 8)
    .map((row) => ({
      name: row.displayName,
      revenue: row.revenue,
      orderCount: row.orderCount,
      itemCount: row.itemCount,
    }));

  const daily = (report.daily ?? []).map((point) => ({
    dateLabel: formatReportingDate(point.date),
    revenue: waiterPerformanceRevenue(point.revenue),
    orderCount: point.orderCount ?? 0,
  }));

  const hourly = (report.hourly ?? []).map((point) => ({
    hour: String(point.hour).padStart(2, "0"),
    hourValue: point.hour,
    revenue: waiterPerformanceRevenue(point.revenue),
    orderCount: point.orderCount ?? 0,
  }));

  const products = (report.products ?? []).map(mapProductRow);

  return {
    currency,
    empty: isWaiterPerformanceReportEmpty(totalOrders, revenue, rows.length),
    kpis: [
      kpi("totalRevenue", revenue),
      kpi("soldItemCount", soldItems),
      kpi("assignedOrderCount", assigned),
      kpi("totalCommission", totalCommission),
      kpi("billsClosedCount", billsClosed),
      kpi("activeWaiterCount", active),
      kpi("unassignedOrderCount", unassigned),
    ],
    rows,
    chartData,
    daily,
    hourly,
    products,
  };
}

export const WAITER_FILTER_ALL = "all";

export function filterWaiterPerformanceReportView(
  view: WaiterPerformanceReportView,
  waiterKey: string,
): WaiterPerformanceReportView {
  if (waiterKey === WAITER_FILTER_ALL || !waiterKey) {
    return view;
  }

  const row = view.rows.find((item) => item.key === waiterKey);
  if (!row) {
    return view;
  }

  const assigned = row.unassigned ? 0 : row.orderCount;
  const unassigned = row.unassigned ? row.orderCount : 0;

  return {
    ...view,
    empty: row.orderCount <= 0 && row.revenue <= 0,
    kpis: [
      kpi("totalRevenue", row.revenue),
      kpi("soldItemCount", row.itemCount),
      kpi("assignedOrderCount", assigned),
      kpi("totalCommission", row.commissionAmount),
      kpi("billsClosedCount", row.billsClosedCount),
      kpi("activeWaiterCount", row.unassigned ? 0 : row.active ? 1 : 0),
      kpi("unassignedOrderCount", unassigned),
    ],
    rows: [row],
    chartData: [
      {
        name: row.displayName,
        revenue: row.revenue,
        orderCount: row.orderCount,
        itemCount: row.itemCount,
      },
    ],
    daily: [],
    hourly: [],
    products: row.topProducts,
  };
}
