import { toAmount, roundMoney } from "../numbers";
import type { ReportingMethodDef } from "../types";

export type WaiterPerformanceKpiId =
  | "activeWaiterCount"
  | "assignedOrderCount"
  | "unassignedOrderCount"
  | "totalRevenue";

export const WAITER_PERFORMANCE_METHODS: {
  [K in WaiterPerformanceKpiId]: ReportingMethodDef<K>;
} = {
  activeWaiterCount: {
    id: "activeWaiterCount",
    label: "Aktif personel",
    method: "activeWaiterCount",
    formula: "COUNT(waiter.active = true)",
    filter: "Menüdeki aktif garson kayıtları",
    unit: "count",
  },
  assignedOrderCount: {
    id: "assignedOrderCount",
    label: "Atanan sipariş",
    method: "assignedOrderCount",
    formula: "COUNT(order.waiterId != null)",
    filter: "Onaylı siparişler",
    unit: "count",
  },
  unassignedOrderCount: {
    id: "unassignedOrderCount",
    label: "Atanmamış sipariş",
    method: "unassignedOrderCount",
    formula: "COUNT(order.waiterId = null)",
    filter: "Onaylı siparişler",
    unit: "count",
  },
  totalRevenue: {
    id: "totalRevenue",
    label: "Toplam ciro",
    method: "totalRevenue",
    formula: "Σ order.totalAmount",
    filter: "Onaylı siparişler",
    unit: "money",
  },
};

export function activeWaiterCount(value?: number | null): number {
  return value ?? 0;
}

export function assignedOrderCount(value?: number | null): number {
  return value ?? 0;
}

export function unassignedOrderCount(value?: number | null): number {
  return value ?? 0;
}

export function waiterPerformanceTotalRevenue(value?: number | string | null): number {
  return toAmount(value);
}

export function waiterPerformanceOrderCount(value?: number | null): number {
  return value ?? 0;
}

export function waiterPerformanceRevenue(value?: number | string | null): number {
  return toAmount(value);
}

export function waiterPerformanceAverageBasket(revenue: number, orderCount: number): number {
  if (orderCount <= 0) return 0;
  return roundMoney(revenue / orderCount);
}

export function isWaiterPerformanceReportEmpty(
  orderCount: number,
  revenue: number,
  waiterCount: number,
): boolean {
  return orderCount <= 0 && revenue <= 0 && waiterCount <= 0;
}
