import type { MenuAnalyticsReportResponse, MenuRevenueReportResponse } from "@/lib/api";
import { visitDropoffStages, visitFunnelEndToEndPercent } from "@/reporting";

import { CHART_COLORS, dayLabel, halfSplit, pctDelta } from "./chart-config";

export function buildTrafficView(
  visits: MenuAnalyticsReportResponse,
  grain: "daily" | "hourly",
  revenue?: MenuRevenueReportResponse | null,
) {
  const daily = visits.daily ?? [];
  const [first, second] = halfSplit(daily);
  const openTrend = pctDelta(
    second.reduce((sum, row) => sum + row.menuOpens, 0),
    first.reduce((sum, row) => sum + row.menuOpens, 0),
  );
  const stages = visitDropoffStages(visits, revenue ? (revenue.kpis.orderCount ?? 0) : null);
  const conversion = visitFunnelEndToEndPercent(stages);
  const menuOpens = stages[0]?.value ?? 0;
  const categoryViews = stages[1]?.value ?? 0;
  const productViews = stages[2]?.value ?? 0;
  const sessions = visits.kpis.sessions;
  const orders = revenue?.kpis.orderCount ?? 0;
  const openSeries = daily.map((row) => ({ label: dayLabel(row.date), value: row.menuOpens }));
  const productSeries = daily.map((row) => ({
    label: dayLabel(row.date),
    value: row.productViews,
  }));
  const devices = visits.devices ?? [];
  const deviceSum = devices.reduce((sum, row) => sum + row.value, 0);
  const products = visits.topProducts ?? [];
  const peakProductViews = Math.max(...products.map((row) => row.views), 1);
  const categories = visits.topCategories ?? [];
  const hourly = visits.hourly ?? [];

  return {
    stages,
    conversion,
    openTrend,
    menuOpensLabel: menuOpens.toLocaleString("tr-TR"),
    productViewsLabel: productViews.toLocaleString("tr-TR"),
    peakOpenLabel: `Zirve: ${peakPoint(openSeries).label}`,
    peakProductLabel: `Zirve: ${peakPoint(productSeries).label}`,
    openSeries,
    productSeries,
    rhythm:
      grain === "hourly" && hourly.length > 0
        ? hourly.map((row) => ({ label: `${row.hour}`, value: row.views }))
        : openSeries,
    rhythmTitle: grain === "hourly" ? "Saatlik görüntülenme" : "Günlük menü açılış",
    insightTitle:
      openTrend != null && openTrend >= 0
        ? `Menü açılış ikinci yarıda %${Math.abs(openTrend).toFixed(0)} güçlendi`
        : "Menüden siparişe dönüşüm",
    insightBody: `Bu dönemde ${menuOpens.toLocaleString("tr-TR")} menü açılışı ve ${sessions.toLocaleString("tr-TR")} oturum kaydedildi.`,
    deviceTotal: deviceSum.toLocaleString("tr-TR"),
    deviceRows: devices.map((row, index) => ({
      label: row.name,
      value: row.value.toLocaleString("tr-TR"),
      percent: (row.value / (deviceSum || 1)) * 100,
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    })),
    topProducts: products.slice(0, 6).map((row, index) => ({
      name: row.name,
      value: row.views.toLocaleString("tr-TR"),
      active: index === 0,
      share: (row.views / peakProductViews) * 100,
    })),
    categoryBars: categories.slice(0, 8).map((row) => ({
      label: row.name.slice(0, 12),
      value: row.views,
    })),
    categoryTotal: String(categories.reduce((sum, row) => sum + row.views, 0)),
    kpis: [
      {
        label: "Menü açılış",
        value: menuOpens.toLocaleString("tr-TR"),
        hint: "Dönem toplamı",
        trend: openTrend,
        spark: daily.map((row) => row.menuOpens),
        color: CHART_COLORS.c1,
      },
      {
        label: "Kategori",
        value: categoryViews.toLocaleString("tr-TR"),
        color: CHART_COLORS.c2,
      },
      {
        label: "Ürün görüntüleme",
        value: productViews.toLocaleString("tr-TR"),
        spark: daily.map((row) => row.productViews),
        color: CHART_COLORS.c3,
      },
      {
        label: "Oturum",
        value: sessions.toLocaleString("tr-TR"),
        spark: daily.map((row) => row.sessions),
        color: CHART_COLORS.c4,
      },
      {
        label: "Dönüşüm",
        value: `%${conversion.toFixed(0)}`,
        hint: "Menü → sipariş",
        color: CHART_COLORS.c5,
      },
      {
        label: revenue ? "Sipariş" : "Cihaz türü",
        value: revenue ? orders.toLocaleString("tr-TR") : String(devices.length),
        hint: devices[0] ? `Lider: ${devices[0].name}` : undefined,
        color: CHART_COLORS.c1,
      },
    ],
  };
}

function peakPoint(rows: { label: string; value: number }[]) {
  return rows.reduce(
    (best, row) => (row.value > best.value ? row : best),
    rows[0] ?? { label: "—", value: 0 },
  );
}
