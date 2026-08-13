import type { MenuRevenueReportResponse } from "@/lib/api";

import { formatReportingDate } from "../period";
import type { ReportingKpiCard, ReportingMethodDef } from "../types";
import {
  REVENUE_METHODS,
  SPOTLIGHT_METHODS,
  averageBasket,
  confirmedOrderCount,
  dailyOrderCount,
  dailyRevenue,
  formatRevenueHourLabel,
  hourlyOrderCount,
  hourlyRevenue,
  isRevenueReportEmpty,
  isSingleDayRange,
  leastSoldByQuantity,
  lineQuantity,
  lineRevenue,
  lineRevenueShare,
  periodStarByQuantity,
  periodStarByRevenue,
  periodStarQuantityLabel,
  soldItemCount,
  totalRevenue,
  unsoldCatalogCount,
  type RevenueKpiId,
  type SoldProductRow,
  type SpotlightMethodId,
} from "./methods";

export type RevenueChartPoint = {
  dateLabel: string;
  revenue: number;
  orderCount: number;
};

export type RevenueBreakdownRow = {
  key: string;
  name: string;
  quantity: number;
  revenue: number;
  share: number;
};

export type SpotlightProduct = SoldProductRow;

export type SpotlightCard = ReportingMethodDef<SpotlightMethodId> & {
  product: SpotlightProduct | null;
  value: number;
  display: string;
};

export type UnsoldSpotlightCard = ReportingKpiCard<SpotlightMethodId> & {
  products: { productId: number; name: string }[];
};

export type HourlyRevenuePoint = {
  hour: string;
  hourValue: number;
  revenue: number;
  orderCount: number;
};

export type RevenueReportView = {
  currency: string;
  empty: boolean;
  singleDay: boolean;
  kpis: ReportingKpiCard<RevenueKpiId>[];
  daily: RevenueChartPoint[];
  products: RevenueBreakdownRow[];
  productsByQuantityAsc: RevenueBreakdownRow[];
  categories: RevenueBreakdownRow[];
  spotlight: {
    byQuantity: SpotlightCard;
    byRevenue: SpotlightCard;
    leastSold: SpotlightCard;
    unsold: UnsoldSpotlightCard;
  };
  hourly: HourlyRevenuePoint[];
};

function kpi(id: RevenueKpiId, value: number): ReportingKpiCard<RevenueKpiId> {
  const def = REVENUE_METHODS[id];
  const display =
    def.unit === "money" ? String(value) : value.toLocaleString("tr-TR");
  return { ...def, value, display };
}

function toSoldRow(row: {
  productId: number;
  name: string;
  quantity: number;
  revenue?: number | string | null;
}): SoldProductRow {
  return {
    productId: row.productId,
    name: row.name,
    quantity: lineQuantity(row.quantity),
    revenue: lineRevenue(row.revenue),
  };
}

function spotlightCard(
  id: SpotlightMethodId,
  product: SpotlightProduct | null,
  labelOverride?: string,
): SpotlightCard {
  const def = SPOTLIGHT_METHODS[id];
  const value = id === "periodStarByRevenue" ? (product?.revenue ?? 0) : (product?.quantity ?? 0);
  return {
    ...def,
    label: labelOverride ?? def.label,
    product,
    value,
    display: product ? product.name : "—",
  };
}

export function buildRevenueReportView(report: MenuRevenueReportResponse): RevenueReportView {
  const currency = report.kpis.currency || "TRY";
  const revenue = totalRevenue(report.kpis.totalRevenue);
  const orders = confirmedOrderCount(report.kpis.orderCount);
  const items = soldItemCount(report.kpis.itemCount);
  const basket = averageBasket(revenue, orders);
  const singleDay = isSingleDayRange(report.from, report.to);

  const products: RevenueBreakdownRow[] = (report.products ?? []).map((row) => {
    const amount = lineRevenue(row.revenue);
    return {
      key: String(row.productId),
      name: row.name,
      quantity: lineQuantity(row.quantity),
      revenue: amount,
      share: lineRevenueShare(amount, revenue),
    };
  });

  const soldRows: SoldProductRow[] = (report.products ?? []).map(toSoldRow);
  const byQuantity =
    report.spotlight?.byQuantity != null
      ? toSoldRow(report.spotlight.byQuantity)
      : periodStarByQuantity(soldRows);
  const byRevenue =
    report.spotlight?.byRevenue != null
      ? toSoldRow(report.spotlight.byRevenue)
      : periodStarByRevenue(soldRows);
  const leastSold =
    report.spotlight?.leastSoldByQuantity != null
      ? toSoldRow(report.spotlight.leastSoldByQuantity)
      : leastSoldByQuantity(soldRows);

  const unsoldProducts = report.unsold?.products ?? [];
  const unsoldCount = unsoldCatalogCount(report.unsold?.count ?? unsoldProducts.length);

  const hourlySource = report.hourly?.length
    ? report.hourly
    : Array.from({ length: 24 }, (_, hour) => ({ hour, revenue: 0, orderCount: 0 }));

  return {
    currency,
    empty: isRevenueReportEmpty(orders, revenue),
    singleDay,
    kpis: [
      kpi("totalRevenue", revenue),
      kpi("confirmedOrderCount", orders),
      kpi("soldItemCount", items),
      kpi("averageBasket", basket),
    ],
    daily: (report.daily ?? []).map((row) => ({
      dateLabel: formatReportingDate(row.date),
      revenue: dailyRevenue(row.revenue),
      orderCount: dailyOrderCount(row.orderCount),
    })),
    products,
    productsByQuantityAsc: [...products].sort((a, b) => {
      if (a.quantity !== b.quantity) return a.quantity - b.quantity;
      if (a.revenue !== b.revenue) return a.revenue - b.revenue;
      return a.key.localeCompare(b.key);
    }),
    categories: (report.categories ?? []).map((row) => {
      const amount = lineRevenue(row.revenue);
      return {
        key: String(row.categoryId ?? row.name),
        name: row.name,
        quantity: lineQuantity(row.quantity),
        revenue: amount,
        share: lineRevenueShare(amount, revenue),
      };
    }),
    spotlight: {
      byQuantity: spotlightCard("periodStarByQuantity", byQuantity, periodStarQuantityLabel(singleDay)),
      byRevenue: spotlightCard("periodStarByRevenue", byRevenue),
      leastSold: spotlightCard("leastSoldByQuantity", leastSold),
      unsold: {
        ...SPOTLIGHT_METHODS.unsoldCatalogCount,
        value: unsoldCount,
        display: unsoldCount.toLocaleString("tr-TR"),
        products: unsoldProducts.map((row) => ({
          productId: row.productId,
          name: row.name,
        })),
      },
    },
    hourly: hourlySource.map((row) => ({
      hour: formatRevenueHourLabel(row.hour),
      hourValue: row.hour,
      revenue: hourlyRevenue(row.revenue),
      orderCount: hourlyOrderCount(row.orderCount),
    })),
  };
}
