import type { MenuAnalyticsReportResponse, MenuRevenueReportResponse } from "@/lib/api";
import { formatReportingDate } from "@/reporting";
import { toAmount } from "@/reporting/numbers";

import { pctDelta } from "./chart-config";
import { readCiroMetrics, readProfitMix, readSoldMix, type CiroMetrics } from "./ciro-metrics";
import { compactAmount, scaleSeries } from "./shadcn-charts";

export type TwinSeries = {
  title: string;
  value: string;
  delta: number | null;
  points: { label: string; value: number }[];
};

export type SparkSplit = {
  label: string;
  value: string;
};

export type SparkKpi = {
  title: string;
  value: string;
  delta: number | null;
  icon: "users" | "userPlus" | "repeat" | "wallet" | "card";
  series: number[];
  splits?: SparkSplit[];
};

export type CategorySlice = {
  name: string;
  value: number;
  display: string;
  percent: number;
};

export function buildTwinTrends(
  current: MenuRevenueReportResponse,
  previous: MenuRevenueReportResponse | undefined,
  money: (value: number) => string,
): [TwinSeries, TwinSeries] {
  const metrics = readCiroMetrics(current);
  const profit = readProfitMix(current, metrics);
  const prior = previous ? readCiroMetrics(previous) : null;
  const priorProfit = previous && prior ? readProfitMix(previous, prior) : null;
  const daily = current.daily ?? [];
  const labels = daily.map((row) => formatReportingDate(row.date));
  const gross = daily.map((row) => toAmount(row.revenue));
  const net = scaleSeries(gross, profit.gross || metrics.total, profit.net);
  return [
    twin("Brüt ciro", money(metrics.total), pctDelta(metrics.total, prior?.total ?? 0), labels, gross),
    twin("Net ciro", money(profit.net), pctDelta(profit.net, priorProfit?.net ?? 0), labels, net),
  ];
}

export function buildCiroSparkKpis(
  current: MenuRevenueReportResponse,
  previous: MenuRevenueReportResponse | undefined,
  money: (value: number) => string,
): SparkKpi[] {
  const metrics = readCiroMetrics(current);
  const prior = previous ? readCiroMetrics(previous) : null;
  const daily = current.daily ?? [];
  const orders = daily.map((row) => row.orderCount ?? 0);
  const revenue = daily.map((row) => toAmount(row.revenue));
  const aov = daily.map((row, index) => {
    const count = orders[index] ?? 0;
    return count > 0 ? (revenue[index] ?? 0) / count : 0;
  });
  const profit = readProfitMix(current, metrics);
  return [
    orderSpark(metrics, prior, orders),
    ciroSpark(metrics, profit.net, prior, money, revenue),
    paymentSpark(metrics, prior, money, revenue),
    spark("Ort. sepet", money(metrics.aov), pctDelta(metrics.aov, prior?.aov ?? 0), "wallet", aov),
  ];
}

export function buildTrafficSparkKpis(
  visits: MenuAnalyticsReportResponse,
  revenue?: MenuRevenueReportResponse | null,
): SparkKpi[] {
  const daily = visits.daily ?? [];
  const sessions = visits.kpis.sessions;
  const opens = visits.kpis.menuOpens;
  const mid = Math.max(1, Math.floor(daily.length / 2));
  const first = daily.slice(0, mid);
  const second = daily.slice(mid);
  const sessionSeries = daily.map((row) => row.sessions);
  const openSeries = daily.map((row) => row.menuOpens);
  const viewSeries = daily.map((row) => row.productViews);
  const repeat = sessions > 0 ? (opens / sessions) * 100 : 0;
  const ltv = sessions > 0 && revenue ? readCiroMetrics(revenue).total / sessions : visits.kpis.avgProductsPerSession;
  return [
    spark("Oturum", sessions.toLocaleString("tr-TR"), halfDelta(second, first, (row) => row.sessions), "users", sessionSeries),
    spark("Menü açılış", opens.toLocaleString("tr-TR"), halfDelta(second, first, (row) => row.menuOpens), "userPlus", openSeries),
    spark("Tekrar oranı", `%${repeat.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`, halfDelta(second, first, (row) => row.productViews), "repeat", viewSeries),
    spark(
      revenue ? "Oturum değeri" : "Ort. ürün",
      revenue ? compactAmount(ltv) : ltv.toLocaleString("tr-TR", { maximumFractionDigits: 1 }),
      halfDelta(second, first, (row) => row.productViews),
      "wallet",
      viewSeries,
    ),
  ];
}

export function buildCategorySales(
  current: MenuRevenueReportResponse,
  previous: MenuRevenueReportResponse | undefined,
  money: (value: number) => string,
): { total: string; compact: string; delta: number | null; slices: CategorySlice[] } {
  const sold = readSoldMix(current);
  const head = sold.categories.slice(0, 4);
  const leftover = sold.categories.slice(4).reduce((sum, row) => sum + row.revenue, 0);
  const slices = leftover > 0 ? [...head, { name: "Diğer", quantity: 0, revenue: leftover }] : head;
  const grand = slices.reduce((sum, row) => sum + row.revenue, 0);
  const priorTotal = previous
    ? readSoldMix(previous).categories.reduce((sum, row) => sum + row.revenue, 0)
    : 0;
  return {
    total: money(grand),
    compact: compactAmount(grand),
    delta: pctDelta(grand, priorTotal),
    slices: slices.map((row) => ({
      name: row.name,
      value: row.revenue,
      display: compactAmount(row.revenue),
      percent: Math.round((row.revenue / (grand || 1)) * 100),
    })),
  };
}

export function buildStaffSparkKpis(
  totalRevenue: number,
  totalTip: number,
  teamItems: number,
  avgItemRevenue: number,
  money: (value: number) => string,
  revenueSeries: number[],
): SparkKpi[] {
  return [
    spark("Ciro", money(totalRevenue), null, "wallet", revenueSeries),
    spark("Bahşiş", money(totalTip), null, "userPlus", revenueSeries),
    spark("Satış adedi", teamItems.toLocaleString("tr-TR"), null, "users", revenueSeries),
    spark("Ort. satış", money(avgItemRevenue), null, "repeat", revenueSeries),
  ];
}

function twin(
  title: string,
  value: string,
  delta: number | null,
  labels: string[],
  values: number[],
): TwinSeries {
  return {
    title,
    value,
    delta,
    points: labels.map((label, index) => ({ label, value: values[index] ?? 0 })),
  };
}

function orderSpark(metrics: CiroMetrics, prior: CiroMetrics | null, series: number[]): SparkKpi {
  const perOrder = metrics.orders > 0 ? metrics.items / metrics.orders : 0;
  return spark(
    "Siparişler",
    metrics.orders.toLocaleString("tr-TR"),
    pctDelta(metrics.orders, prior?.orders ?? 0),
    "users",
    series,
    [
      { label: "Kalem", value: metrics.items.toLocaleString("tr-TR") },
      { label: "Sipariş başı", value: perOrder.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) },
    ],
  );
}

function ciroSpark(
  metrics: CiroMetrics,
  net: number,
  prior: CiroMetrics | null,
  money: (value: number) => string,
  series: number[],
): SparkKpi {
  return spark(
    "Ciro",
    money(metrics.total),
    pctDelta(metrics.total, prior?.total ?? 0),
    "wallet",
    series,
    [
      { label: "Brüt", value: money(metrics.total) },
      { label: "Net", value: money(net) },
    ],
  );
}

function paymentSpark(
  metrics: CiroMetrics,
  prior: CiroMetrics | null,
  money: (value: number) => string,
  series: number[],
): SparkKpi {
  return spark(
    "Ödeme",
    money(metrics.paymentTotal),
    pctDelta(metrics.paymentTotal, prior?.paymentTotal ?? 0),
    "card",
    series,
    [
      { label: "Kart", value: money(metrics.card) },
      { label: "Nakit", value: money(metrics.cash) },
    ],
  );
}

function spark(
  title: string,
  value: string,
  delta: number | null,
  icon: SparkKpi["icon"],
  series: number[],
  splits?: SparkSplit[],
): SparkKpi {
  return { title, value, delta, icon, series, ...(splits ? { splits } : {}) };
}

function halfDelta<TRow>(
  second: TRow[],
  first: TRow[],
  pick: (row: TRow) => number,
): number | null {
  return pctDelta(
    second.reduce((sum, row) => sum + pick(row), 0),
    first.reduce((sum, row) => sum + pick(row), 0),
  );
}
