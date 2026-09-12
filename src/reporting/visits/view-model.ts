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

export type VisitDropoffStage = {
  label: string;
  value: number;
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
  treeData: VisitTreeNode[];
  topProducts: { name: string; views: number }[];
  topCategories: { name: string; views: number }[];
  sampleJourneys: MenuAnalyticsReportResponse["sampleJourneys"];
};

function kpi(id: VisitKpiId, value: number, display: string): ReportingKpiCard<VisitKpiId> {
  return { ...VISIT_METHODS[id], value, display };
}

export function visitDropoffStages(
  report: MenuAnalyticsReportResponse,
  orderCount?: number | null,
): VisitDropoffStage[] {
  const stages: VisitDropoffStage[] = [
    {
      label: "Menü açılış",
      value: menuOpenCount(report.funnel?.menuOpens ?? report.kpis.menuOpens),
    },
    {
      label: "Kategori",
      value: categoryViewCount(report.funnel?.categoryViews ?? report.kpis.categoryViews),
    },
    {
      label: "Ürün",
      value: productViewCount(report.funnel?.productViews ?? report.kpis.productViews),
    },
    {
      label: "Oturum",
      value: sessionCount(report.kpis.sessions),
    },
  ];
  if (orderCount == null) return stages;
  return [...stages, { label: "Sipariş", value: orderCount }];
}

export function visitFunnelEndToEndPercent(stages: VisitDropoffStage[]): number {
  const first = stages[0]?.value ?? 0;
  const last = stages[stages.length - 1]?.value ?? 0;
  if (first <= 0) return 0;
  return Math.min(100, (last / first) * 100);
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
