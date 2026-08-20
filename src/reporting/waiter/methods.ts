import { toAmount, roundMoney } from "../numbers";
import type { ReportingMethodDef } from "../types";

export type WaiterPerformanceKpiId =
  | "activeWaiterCount"
  | "assignedOrderCount"
  | "unassignedOrderCount"
  | "totalRevenue"
  | "soldItemCount"
  | "totalCommission"
  | "totalTip"
  | "billsClosedCount";

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
    label: "Atanan adisyon",
    method: "assignedOrderCount",
    formula: "COUNT(bill.closedByWaiterId != null)",
    filter: "Kapalı adisyonlar",
    unit: "count",
  },
  unassignedOrderCount: {
    id: "unassignedOrderCount",
    label: "Atanmamış adisyon",
    method: "unassignedOrderCount",
    formula: "COUNT(bill.closedByWaiterId = null)",
    filter: "Kapalı adisyonlar",
    unit: "count",
  },
  totalRevenue: {
    id: "totalRevenue",
    label: "Toplam ciro",
    method: "totalRevenue",
    formula: "Σ bill.totalAmount",
    filter: "Kapalı adisyonlar (kapatan garson)",
    unit: "money",
  },
  soldItemCount: {
    id: "soldItemCount",
    label: "Satılan ürün",
    method: "soldItemCount",
    formula: "Σ billItem.quantity",
    filter: "Kapalı adisyon kalemleri",
    unit: "count",
  },
  totalCommission: {
    id: "totalCommission",
    label: "Toplam komisyon",
    method: "totalCommission",
    formula: "Σ bill.commissionAmount",
    filter: "Kapalı adisyonlar",
    unit: "money",
  },
  totalTip: {
    id: "totalTip",
    label: "Toplam bahşiş",
    method: "totalTip",
    formula: "Σ bill.tipAmount",
    filter: "Kapalı adisyonlar",
    unit: "money",
  },
  billsClosedCount: {
    id: "billsClosedCount",
    label: "Kapanan adisyon",
    method: "billsClosedCount",
    formula: "COUNT(bill.status = CLOSED)",
    filter: "Seçilen dönemde kapanan adisyonlar",
    unit: "count",
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

export function waiterPerformanceSoldItemCount(value?: number | null): number {
  return value ?? 0;
}

export function waiterPerformanceTotalCommission(value?: number | string | null): number {
  return toAmount(value);
}

export function waiterPerformanceTotalTip(value?: number | string | null): number {
  return toAmount(value);
}

export function waiterPerformanceBillsClosedCount(value?: number | null): number {
  return value ?? 0;
}

export function waiterPerformanceOrderCount(value?: number | null): number {
  return value ?? 0;
}

export function waiterPerformanceItemCount(value?: number | null): number {
  return value ?? 0;
}

export function waiterPerformanceRevenue(value?: number | string | null): number {
  return toAmount(value);
}

export function waiterPerformanceCommission(value?: number | string | null): number {
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
