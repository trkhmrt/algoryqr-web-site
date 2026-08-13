import type { MenuAnalyticsReportResponse } from "@/lib/api";

import { formatReportingDate } from "../period";
import type { ReportingKpiCard } from "../types";
import {
  VISIT_METHODS,
  averageProductsPerSession,
  categoryViewCount,
  deviceSharePercent,
  deviceTotal,
  formatAverageProductsPerSession,
  formatHourLabel,
  hourlyEventCount,
  isVisitReportEmpty,
  menuOpenCount,
  productViewCount,
  sessionCount,
  treemapSize,
  type VisitKpiId,
} from "./methods";

export type VisitChartPoint = {
  dateLabel: string;
  sessions: number;
  menuOpens: number;
  productViews: number;
};

export type VisitHourPoint = {
  hour: string;
  views: number;
};

export type VisitDeviceRow = {
  name: string;
  value: number;
  pct: number;
};

export type VisitFunnelStep = {
  name: string;
  value: number;
  method: string;
};

export type VisitTreeNode = {
  name: string;
  size: number;
  children: { name: string; size: number }[];
};

export type VisitReportView = {
  empty: boolean;
  kpis: ReportingKpiCard<VisitKpiId>[];
  daily: VisitChartPoint[];
  hourly: VisitHourPoint[];
  devices: VisitDeviceRow[];
  funnel: VisitFunnelStep[];
  treeData: VisitTreeNode[];
  topProducts: { name: string; views: number }[];
  topCategories: { name: string; views: number }[];
  sampleJourneys: MenuAnalyticsReportResponse["sampleJourneys"];
};

function kpi(id: VisitKpiId, value: number, display: string): ReportingKpiCard<VisitKpiId> {
  return { ...VISIT_METHODS[id], value, display };
}

export function buildVisitReportView(
  report: MenuAnalyticsReportResponse | undefined,
): VisitReportView {
  const sessions = sessionCount(report?.kpis.sessions);
  const opens = menuOpenCount(report?.kpis.menuOpens);
  const products = productViewCount(report?.kpis.productViews);
  const avgProducts = averageProductsPerSession(report?.kpis.avgProductsPerSession);
  const devicesRaw = report?.devices ?? [];
  const totalDevices = deviceTotal(devicesRaw);

  return {
    empty: isVisitReportEmpty(sessions, opens),
    kpis: [
      kpi("sessions", sessions, sessions.toLocaleString("tr-TR")),
      kpi("menuOpens", opens, opens.toLocaleString("tr-TR")),
      kpi("productViews", products, products.toLocaleString("tr-TR")),
      kpi(
        "averageProductsPerSession",
        avgProducts,
        formatAverageProductsPerSession(avgProducts),
      ),
    ],
    daily: (report?.daily ?? []).map((row) => ({
      dateLabel: formatReportingDate(row.date),
      sessions: sessionCount(row.sessions),
      menuOpens: menuOpenCount(row.menuOpens),
      productViews: productViewCount(row.productViews),
    })),
    hourly: (report?.hourly ?? []).map((row) => ({
      hour: formatHourLabel(row.hour),
      views: hourlyEventCount(row.views),
    })),
    devices: devicesRaw.map((row) => ({
      name: row.name,
      value: row.value,
      pct: deviceSharePercent(row.value, totalDevices),
    })),
    funnel: [
      {
        name: "Menü",
        value: menuOpenCount(report?.funnel?.menuOpens),
        method: "menuOpenCount",
      },
      {
        name: "Kategori",
        value: categoryViewCount(report?.funnel?.categoryViews),
        method: "categoryViewCount",
      },
      {
        name: "Ürün",
        value: productViewCount(report?.funnel?.productViews),
        method: "productViewCount",
      },
    ],
    treeData: (report?.categoryProductTree ?? []).map((node) => ({
      name: node.name,
      size: treemapSize(node.size),
      children: (node.children ?? []).map((child) => ({
        name: child.name,
        size: treemapSize(child.size),
      })),
    })),
    topProducts: (report?.topProducts ?? []).map((row) => ({
      name: row.name,
      views: productViewCount(row.views),
    })),
    topCategories: (report?.topCategories ?? []).map((row) => ({
      name: row.name,
      views: categoryViewCount(row.views),
    })),
    sampleJourneys: report?.sampleJourneys ?? [],
  };
}
