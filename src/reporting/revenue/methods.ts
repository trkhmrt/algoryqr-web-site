import { toAmount, roundMoney, revenueShare } from "../numbers";
import type { ReportingMethodDef } from "../types";

export type RevenueKpiId =
  | "totalRevenue"
  | "confirmedOrderCount"
  | "soldItemCount"
  | "averageBasket";

export const REVENUE_METHODS: { [K in RevenueKpiId]: ReportingMethodDef<K> } = {
  totalRevenue: {
    id: "totalRevenue",
    label: "Toplam ciro",
    method: "totalRevenue",
    formula: "Σ bill.totalAmount",
    filter: "status = CLOSED ve closedAt ∈ [from, to]",
    unit: "money",
  },
  confirmedOrderCount: {
    id: "confirmedOrderCount",
    label: "Adisyon",
    method: "confirmedOrderCount",
    formula: "COUNT(bill)",
    filter: "status = CLOSED ve closedAt ∈ [from, to]",
    unit: "count",
  },
  soldItemCount: {
    id: "soldItemCount",
    label: "Satılan ürün",
    method: "soldItemCount",
    formula: "Σ billItem.quantity",
    filter: "Kapalı adisyon kalemleri",
    unit: "count",
  },
  averageBasket: {
    id: "averageBasket",
    label: "Ort. sepet",
    method: "averageBasket",
    formula: "totalRevenue / closedBillCount",
    filter: "Adisyon yoksa 0; 2 ondalık HALF_UP",
    unit: "money",
  },
};

/**
 * Toplam ciro.
 * Kaynak: kapalı adisyonların `totalAmount` toplamı (bahşiş hariç).
 */
export function totalRevenue(value?: number | string | null): number {
  return toAmount(value);
}

/** Onaylı sipariş adedi. */
export function confirmedOrderCount(value?: number | null): number {
  return value ?? 0;
}

/** Satılan ürün adedi (kalem miktarları toplamı). */
export function soldItemCount(value?: number | null): number {
  return value ?? 0;
}

/**
 * Ort. sepet (AOV).
 * averageBasket = totalRevenue / confirmedOrderCount
 * Sipariş 0 ise 0.
 */
export function averageBasket(revenue: number, orderCount: number): number {
  if (orderCount <= 0) return 0;
  return roundMoney(revenue / orderCount);
}

/** Günlük ciro: o güne denk gelen onaylı sipariş tutarları toplamı. */
export function dailyRevenue(value?: number | string | null): number {
  return toAmount(value);
}

/** Günlük sipariş adedi. */
export function dailyOrderCount(value?: number | null): number {
  return value ?? 0;
}

/** Ürün / kategori cirosu: kalem `lineTotal` (yoksa unitPrice × quantity) toplamı. */
export function lineRevenue(value?: number | string | null): number {
  return toAmount(value);
}

/** Ürün / kategori satılan adet. */
export function lineQuantity(value?: number | null): number {
  return value ?? 0;
}

/**
 * Ciro payı (%).
 * revenueShare = lineRevenue / totalRevenue × 100
 */
export function lineRevenueShare(line: number, revenue: number): number {
  return revenueShare(line, revenue);
}

export function isRevenueReportEmpty(orderCount: number, revenue: number): boolean {
  return orderCount === 0 && revenue === 0;
}

export type SpotlightMethodId =
  | "periodStarByQuantity"
  | "periodStarByRevenue"
  | "leastSoldByQuantity"
  | "unsoldCatalogCount";

export const SPOTLIGHT_METHODS: { [K in SpotlightMethodId]: ReportingMethodDef<K> } = {
  periodStarByQuantity: {
    id: "periodStarByQuantity",
    label: "En çok satılan",
    method: "periodStarByQuantity",
    formula: "ARGMAX(Σ item.quantity GROUP BY productId)",
    filter: "status = CONFIRMED ve confirmedAt ∈ [from, to]",
    unit: "count",
  },
  periodStarByRevenue: {
    id: "periodStarByRevenue",
    label: "En yüksek ciro",
    method: "periodStarByRevenue",
    formula: "ARGMAX(Σ lineTotal GROUP BY productId)",
    filter: "status = CONFIRMED ve confirmedAt ∈ [from, to]",
    unit: "money",
  },
  leastSoldByQuantity: {
    id: "leastSoldByQuantity",
    label: "En az satılan",
    method: "leastSoldByQuantity",
    formula: "ARGMIN(Σ item.quantity GROUP BY productId)",
    filter: "Dönemde en az 1 satışı olan ürünler; satılmayan katalog bu metoda girmez",
    unit: "count",
  },
  unsoldCatalogCount: {
    id: "unsoldCatalogCount",
    label: "Satılmayan ürün",
    method: "unsoldCatalogCount",
    formula: "COUNT(catalog where deleted = false) − COUNT(distinct sold productId)",
    filter: "Katalog ürünleri; dönemde kalemi olmayanlar",
    unit: "count",
  },
};

export type HourlyRevenueMethodId = "hourlyOrderCount" | "hourlyRevenue";

export const HOURLY_REVENUE_METHODS: { [K in HourlyRevenueMethodId]: ReportingMethodDef<K> } = {
  hourlyOrderCount: {
    id: "hourlyOrderCount",
    label: "Saatlik sipariş",
    method: "hourlyOrderCount",
    formula: "COUNT(order) GROUP BY hour(confirmedAt)",
    filter: "status = CONFIRMED; dönemdeki günlerin aynı saati toplanır (0–23)",
    unit: "count",
  },
  hourlyRevenue: {
    id: "hourlyRevenue",
    label: "Saatlik ciro",
    method: "hourlyRevenue",
    formula: "Σ order.totalAmount GROUP BY hour(confirmedAt)",
    filter: "status = CONFIRMED; dönemdeki günlerin aynı saati toplanır (0–23)",
    unit: "money",
  },
};

export function periodStarQuantityLabel(singleDay: boolean): string {
  return singleDay ? "Günün ürünü" : SPOTLIGHT_METHODS.periodStarByQuantity.label;
}

export type SoldProductRow = {
  productId: number;
  name: string;
  quantity: number;
  revenue: number;
};

function compareQuantityDesc(a: SoldProductRow, b: SoldProductRow): number {
  if (b.quantity !== a.quantity) return b.quantity - a.quantity;
  if (b.revenue !== a.revenue) return b.revenue - a.revenue;
  return a.productId - b.productId;
}

function compareRevenueDesc(a: SoldProductRow, b: SoldProductRow): number {
  if (b.revenue !== a.revenue) return b.revenue - a.revenue;
  if (b.quantity !== a.quantity) return b.quantity - a.quantity;
  return a.productId - b.productId;
}

function compareQuantityAsc(a: SoldProductRow, b: SoldProductRow): number {
  if (a.quantity !== b.quantity) return a.quantity - b.quantity;
  if (a.revenue !== b.revenue) return a.revenue - b.revenue;
  return a.productId - b.productId;
}

/** Adet lideri. Satış yoksa null. */
export function periodStarByQuantity(products: SoldProductRow[]): SoldProductRow | null {
  if (products.length === 0) return null;
  return [...products].sort(compareQuantityDesc)[0] ?? null;
}

/** Ciro lideri. Satış yoksa null. */
export function periodStarByRevenue(products: SoldProductRow[]): SoldProductRow | null {
  if (products.length === 0) return null;
  return [...products].sort(compareRevenueDesc)[0] ?? null;
}

/** En az satan (satışı olanlar). Satış yoksa null. */
export function leastSoldByQuantity(products: SoldProductRow[]): SoldProductRow | null {
  if (products.length === 0) return null;
  return [...products].sort(compareQuantityAsc)[0] ?? null;
}

export function unsoldCatalogCount(value?: number | null): number {
  return value ?? 0;
}

export function hourlyOrderCount(value?: number | null): number {
  return value ?? 0;
}

export function hourlyRevenue(value?: number | string | null): number {
  return toAmount(value);
}

export function formatRevenueHourLabel(hour: number): string {
  return String(hour).padStart(2, "0");
}

export function isSingleDayRange(from: string, to: string): boolean {
  return from === to;
}
