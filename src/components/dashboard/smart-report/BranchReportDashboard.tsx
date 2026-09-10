"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { SlidingTabSelect } from "@/components/ui/sliding-tab-select";
import type {
  MenuAnalyticsReportResponse,
  MenuRevenueReportResponse,
  MenuWaiterPerformanceReportResponse,
} from "@/lib/api";
import type { SmartReportResult } from "@/lib/smart-report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  CHART_COLORS,
  dayLabel,
  halfSplit,
  money,
  num,
  pctDelta,
} from "./chart-config";
import { ReportEmpty, ReportSkeleton } from "./ReportChartCard";
import { HighlightBarChart } from "./charts/HighlightBarChart";
import { KpiStatCards } from "./charts/KpiStatCards";
import {
  RankListCard,
  RadialProgressChart,
  SegmentProgressCard,
} from "./charts/RadialProgressChart";
import { RadarCompareChart } from "./charts/RadarCompareChart";
import { SharePieChart } from "./charts/SharePieChart";
import { StackedBarChart } from "./charts/StackedBarChart";
import { TrendAreaChart } from "./charts/TrendAreaChart";
import {
  DropoffFunnelChart,
  GrossVolumeCard,
  InsightHighlightCard,
  MetricTile,
  RetentionStepChart,
  SparkMetricCard,
} from "./charts/ZentraOverview";

type TabId =
  | "overview"
  | "revenue"
  | "channels"
  | "products"
  | "traffic"
  | "staff"
  | "insights";

const FULL_TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Özet" },
  { id: "revenue", label: "Ciro" },
  { id: "channels", label: "Kanallar" },
  { id: "products", label: "Ürün" },
  { id: "traffic", label: "Trafik" },
  { id: "staff", label: "Personel" },
  { id: "insights", label: "AI" },
];

const COMPACT_TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Özet" },
  { id: "channels", label: "Kanallar" },
  { id: "insights", label: "AI" },
];

export default function BranchReportDashboard({
  revenue,
  visits,
  waiter,
  result,
  compact,
  loading,
  initialTab,
  allowedTabs,
}: {
  revenue?: MenuRevenueReportResponse | null;
  visits?: MenuAnalyticsReportResponse | null;
  waiter?: MenuWaiterPerformanceReportResponse | null;
  result?: SmartReportResult | null;
  compact?: boolean;
  loading?: boolean;
  initialTab?: TabId;
  allowedTabs?: TabId[];
}) {
  const tabs = useMemo(() => {
    if (allowedTabs?.length) {
      const map = new Map(FULL_TABS.map((t) => [t.id, t]));
      return allowedTabs.map((id) => map.get(id)).filter(Boolean) as {
        id: TabId;
        label: string;
      }[];
    }
    return compact ? COMPACT_TABS : FULL_TABS;
  }, [allowedTabs, compact]);

  const [tab, setTab] = useState<TabId>(initialTab ?? tabs[0]?.id ?? "overview");
  const [grain, setGrain] = useState<"daily" | "hourly">("daily");
  const activeTab = tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id ?? "overview";

  useEffect(() => {
    if (initialTab && tabs.some((t) => t.id === initialTab)) {
      setTab(initialTab);
      return;
    }
    setTab((current) =>
      tabs.some((t) => t.id === current) ? current : (tabs[0]?.id ?? "overview"),
    );
  }, [initialTab, tabs]);

  if (loading && !revenue) {
    return <ReportSkeleton rows={6} />;
  }

  if (!revenue) {
    if (result) {
      return <InsightsSection result={result} compact={compact} />;
    }
    return <ReportEmpty text="Rapor verisi yüklenemedi." />;
  }

  const currency = revenue.kpis.currency || "TRY";
  const m = (v: number) => money(v, currency);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SlidingTabSelect
          value={activeTab}
          onValueChange={(v) => setTab(v as TabId)}
          items={tabs.map((t) => ({ value: t.id, label: t.label }))}
          size="sm"
          variant="soft"
          className="w-full overflow-x-auto"
          ariaLabel="Rapor sekmeleri"
        />
        {(activeTab === "revenue" || activeTab === "overview" || activeTab === "traffic") && (
          <div className="inline-flex shrink-0 rounded-xl border border-border bg-card p-1">
            {(
              [
                { id: "daily", label: "Günlük" },
                { id: "hourly", label: "Saatlik" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setGrain(opt.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  grain === opt.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${grain}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "overview" ? (
            <OverviewSection
              revenue={revenue}
              visits={visits}
              waiter={waiter}
              result={result}
              grain={grain}
              money={m}
            />
          ) : null}
          {activeTab === "revenue" ? (
            <RevenueSection revenue={revenue} grain={grain} money={m} />
          ) : null}
          {activeTab === "channels" ? (
            <ChannelsSection revenue={revenue} money={m} />
          ) : null}
          {activeTab === "products" ? (
            <ProductsSection revenue={revenue} money={m} />
          ) : null}
          {activeTab === "traffic" ? (
            visits ? (
              <TrafficSection visits={visits} grain={grain} />
            ) : (
              <ReportEmpty text="Trafik verisi yok." />
            )
          ) : null}
          {activeTab === "staff" ? (
            waiter ? (
              <StaffSection waiter={waiter} money={m} />
            ) : (
              <ReportEmpty text="Personel verisi yok." />
            )
          ) : null}
          {activeTab === "insights" ? (
            <InsightsSection result={result} compact={compact} />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function OverviewSection({
  revenue,
  visits,
  waiter,
  result,
  grain,
  money: m,
}: {
  revenue: MenuRevenueReportResponse;
  visits?: MenuAnalyticsReportResponse | null;
  waiter?: MenuWaiterPerformanceReportResponse | null;
  result?: SmartReportResult | null;
  grain: "daily" | "hourly";
  money: (v: number) => string;
}) {
  const total = num(revenue.kpis.totalRevenue);
  const orders = revenue.kpis.orderCount ?? 0;
  const aov = num(revenue.kpis.avgOrderValue);
  const daily = revenue.daily ?? [];
  const [first, second] = halfSplit(daily);
  const firstRev = first.reduce((s, d) => s + num(d.revenue), 0);
  const secondRev = second.reduce((s, d) => s + num(d.revenue), 0);
  const trend = pctDelta(secondRev, firstRev);
  const sparkOrders = daily.map((d) => ({
    label: dayLabel(d.date),
    value: d.orderCount ?? 0,
  }));
  const sparkSessions = (visits?.daily ?? []).map((d) => ({
    label: dayLabel(d.date),
    value: d.sessions,
  }));
  const peakOrder = sparkOrders.reduce(
    (best, row) => (row.value > best.value ? row : best),
    sparkOrders[0] ?? { label: "—", value: 0 },
  );

  const menuOpens = visits?.funnel?.menuOpens ?? visits?.kpis.menuOpens ?? orders;
  const categoryViews = visits?.funnel?.categoryViews ?? visits?.kpis.categoryViews ?? Math.round(orders * 1.3);
  const productViews = visits?.funnel?.productViews ?? visits?.kpis.productViews ?? Math.round(orders * 1.8);
  const sessions = visits?.kpis.sessions ?? orders;

  const cash = num(revenue.paymentBreakdown?.cashRevenue);
  const card = num(revenue.paymentBreakdown?.cardRevenue);
  const tip = num(revenue.paymentBreakdown?.tipRevenue);
  const channels = [...(revenue.channels ?? [])].filter((c) => c.connected || num(c.revenue) > 0);
  const volumeRows =
    channels.length > 0
      ? channels.slice(0, 3).map((c, i) => ({
          label: c.label,
          value: m(num(c.revenue)),
          percent: num(c.sharePercent) || (num(c.revenue) / Math.max(total, 1)) * 100,
          color: `hsl(var(--chart-${(i % 5) + 1}))`,
        }))
      : [
          {
            label: "Nakit",
            value: m(cash),
            percent: total > 0 ? (cash / total) * 100 : 0,
            color: CHART_COLORS.c4,
          },
          {
            label: "Kart",
            value: m(card),
            percent: total > 0 ? (card / total) * 100 : 0,
            color: CHART_COLORS.c1,
          },
          {
            label: "Bahşiş",
            value: m(tip),
            percent: total > 0 ? (tip / total) * 100 : 0,
            color: CHART_COLORS.c5,
          },
        ].filter((r) => r.percent > 0);

  const insight = result?.sections?.[0];
  const conversion =
    menuOpens > 0 ? Math.min(100, (orders / menuOpens) * 100) : Math.min(100, aov > 0 ? 72 : 40);
  const tipTotal = tip;
  const net = num(revenue.paymentBreakdown?.netRevenue) || total;
  const sparkRevenue = daily.map((d) => num(d.revenue));
  const sparkOrderVals = sparkOrders.map((d) => d.value);
  const sparkSessionVals = sparkSessions.map((d) => d.value);
  const sparkAov = daily.map((d) => {
    const orders = d.orderCount ?? 0;
    return orders > 0 ? num(d.revenue) / orders : 0;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricTile
          label="Brüt ciro"
          value={m(total)}
          trend={trend}
          hint="Dönem toplamı"
          spark={sparkRevenue}
          sparkColor={CHART_COLORS.c1}
        />
        <MetricTile
          label="Sipariş"
          value={orders.toLocaleString("tr-TR")}
          hint={`Zirve ${peakOrder.label}`}
          spark={sparkOrderVals}
          sparkColor={CHART_COLORS.c2}
        />
        <MetricTile
          label="Ort. sepet"
          value={m(aov)}
          hint="AOV"
          spark={sparkAov}
          sparkColor={CHART_COLORS.c4}
        />
        <MetricTile
          label="Oturum"
          value={(visits?.kpis.sessions ?? 0).toLocaleString("tr-TR")}
          hint="Menü trafiği"
          spark={sparkSessionVals.length ? sparkSessionVals : sparkOrderVals}
          sparkColor={CHART_COLORS.c3}
        />
        <MetricTile
          label="Dönüşüm"
          value={`%${conversion.toFixed(0)}`}
          hint="Menü → sipariş"
        />
        <MetricTile
          label="Net ciro"
          value={m(net)}
          spark={sparkRevenue}
          sparkColor={CHART_COLORS.c5}
          hint={
            waiter
              ? `${waiter.kpis.activeWaiterCount ?? 0} aktif personel`
              : tipTotal > 0
                ? `Bahşiş ${m(tipTotal)}`
                : undefined
          }
        />
      </div>

      <DropoffFunnelChart
        title="Sipariş hunisi"
        description="Her aşamadaki hacim, adım dönüşümü ve kayıp"
        stages={[
          { label: "Menü açılış", value: menuOpens },
          { label: "Kategori", value: categoryViews },
          { label: "Ürün", value: productViews },
          { label: "Oturum", value: sessions },
          { label: "Sipariş", value: orders },
        ]}
        exploreHint={
          insight
            ? insight.heading
            : `Uçtan uca dönüşüm %${conversion.toFixed(0)}. Düşük badge’li adımda kayıp yoğunlaşıyor.`
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <GrossVolumeCard
          title="Ciro kırılımı"
          value={m(total)}
          trend={trend}
          rows={volumeRows}
        />
        <RetentionStepChart
          title={grain === "hourly" ? "Saatlik sipariş" : "Günlük sipariş"}
          data={
            grain === "hourly" && (revenue.hourly?.length ?? 0) > 0
              ? (revenue.hourly ?? []).map((h) => ({
                  label: `${h.hour}`,
                  value: h.orderCount ?? 0,
                }))
              : sparkOrders
          }
        />
        <InsightHighlightCard
          percent={`%${conversion.toFixed(0)}`}
          title={
            insight?.heading ||
            (trend != null && trend >= 0
              ? `Ciro ikinci yarıda %${Math.abs(trend).toFixed(0)} güçlendi`
              : "Dönüşüm ve sepet sağlığı")
          }
          body={
            insight?.body?.slice(0, 180) ||
            `Bu dönemde ${orders.toLocaleString("tr-TR")} sipariş ve ${m(total)} ciro kaydedildi.`
          }
          progress={conversion}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SparkMetricCard
          title="Sipariş trendi"
          value={orders.toLocaleString("tr-TR")}
          deltaLabel={
            trend != null
              ? `${trend >= 0 ? "+" : ""}${Math.round((orders * Math.abs(trend)) / 100)}`
              : undefined
          }
          peakLabel={`Zirve: ${peakOrder.label}`}
          data={sparkOrders}
          color={CHART_COLORS.c1}
        />
        <SparkMetricCard
          title="Oturum trendi"
          value={(visits?.kpis.sessions ?? 0).toLocaleString("tr-TR")}
          deltaLabel={
            waiter ? `${waiter.kpis.activeWaiterCount ?? 0} personel` : undefined
          }
          peakLabel={`Ort. sepet ${m(aov)}`}
          data={sparkSessions.length ? sparkSessions : sparkOrders}
          color={CHART_COLORS.c3}
        />
      </div>
    </div>
  );
}

function RevenueSection({
  revenue,
  grain,
  money: m,
}: {
  revenue: MenuRevenueReportResponse;
  grain: "daily" | "hourly";
  money: (v: number) => string;
}) {
  const daily = (revenue.daily ?? []).map((d) => ({
    label: dayLabel(d.date),
    revenue: num(d.revenue),
    orders: d.orderCount ?? 0,
  }));
  const hourly = (revenue.hourly ?? []).map((h) => ({
    label: `${h.hour}:00`,
    revenue: num(h.revenue),
    orders: h.orderCount ?? 0,
  }));
  const series = grain === "hourly" && hourly.length ? hourly : daily;
  const payment = revenue.paymentBreakdown;
  const cash = num(payment?.cashRevenue);
  const card = num(payment?.cardRevenue);
  const tip = num(payment?.tipRevenue);
  const gross = num(payment?.grossRevenue) || cash + card;
  const net = num(payment?.netRevenue) || gross;
  const den = cash + card || 1;
  const sparkRevenue = daily.map((d) => d.revenue);
  const sparkOrders = daily.map((d) => d.orders);
  const sparkAov = daily.map((d) => (d.orders > 0 ? d.revenue / d.orders : 0));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricTile
          label="Toplam ciro"
          value={m(num(revenue.kpis.totalRevenue))}
          spark={sparkRevenue}
          sparkColor={CHART_COLORS.c1}
        />
        <MetricTile
          label="Sipariş"
          value={(revenue.kpis.orderCount ?? 0).toLocaleString("tr-TR")}
          spark={sparkOrders}
          sparkColor={CHART_COLORS.c2}
        />
        <MetricTile
          label="Ort. sepet"
          value={m(num(revenue.kpis.avgOrderValue))}
          spark={sparkAov}
          sparkColor={CHART_COLORS.c4}
        />
        <MetricTile
          label="Net"
          value={m(net)}
          hint={`Nakit %${((cash / den) * 100).toFixed(0)}`}
          spark={sparkRevenue}
          sparkColor={CHART_COLORS.c5}
        />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <TrendAreaChart
          title="Ciro seyri"
          value={m(num(revenue.kpis.totalRevenue))}
          data={series}
          series={[
            { key: "revenue", label: "Ciro", color: CHART_COLORS.c1 },
            { key: "orders", label: "Sipariş", color: CHART_COLORS.c3, dashed: true },
          ]}
        />
        <HighlightBarChart
          title={grain === "hourly" ? "Saatlik ciro" : "Günlük ciro"}
          value={m(num(revenue.kpis.totalRevenue))}
          data={series.map((s) => ({ label: s.label, value: s.revenue }))}
        />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <SegmentProgressCard
          title="Ödeme kırılımı"
          leftLabel={`%${((cash / den) * 100).toFixed(0)} nakit`}
          rightLabel={`Net ${m(net)}`}
          segments={[
            { label: "Nakit", percent: (cash / den) * 100, color: CHART_COLORS.c4 },
            { label: "Kart", percent: (card / den) * 100, color: CHART_COLORS.c1 },
            {
              label: "Bahşiş",
              percent: tip > 0 ? Math.max(4, (tip / (den + tip)) * 100) : 0,
              color: CHART_COLORS.c5,
            },
          ]}
        />
        <RadialProgressChart
          title="Net / brüt"
          percent={gross > 0 ? Math.min(100, (net / gross) * 100) : 0}
          centerLabel="sağlık"
          color={CHART_COLORS.c4}
        />
      </div>
    </div>
  );
}

function ChannelsSection({
  revenue,
  money: m,
}: {
  revenue: MenuRevenueReportResponse;
  money: (v: number) => string;
}) {
  const channels = useMemo(
    () => [...(revenue.channels ?? [])].filter((c) => c.connected || num(c.revenue) > 0),
    [revenue.channels],
  );
  const total = channels.reduce((s, c) => s + num(c.revenue), 0) || 1;

  const dailyStacked = useMemo(() => {
    const map = new Map<string, Record<string, number | string>>();
    for (const point of revenue.channelDaily ?? []) {
      const row = map.get(point.date) ?? { label: dayLabel(point.date) };
      row[point.channelCode] = num(point.revenue);
      map.set(point.date, row);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, v]) => v);
  }, [revenue.channelDaily]);

  const codes = [...new Set((revenue.channelDaily ?? []).map((p) => p.channelCode))];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {channels.slice(0, 4).map((c, i) => {
          const spark = (revenue.channelDaily ?? [])
            .filter((p) => p.channelCode === c.code)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((p) => num(p.revenue));
          return (
            <MetricTile
              key={c.code}
              label={c.label}
              value={m(num(c.revenue))}
              hint={`${(c.orderCount ?? 0).toLocaleString("tr-TR")} sipariş · %${(num(c.sharePercent) || (num(c.revenue) / total) * 100).toFixed(0)}`}
              spark={spark}
              sparkColor={`hsl(var(--chart-${(i % 5) + 1}))`}
            />
          );
        })}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <SharePieChart
          title="Kanal payı"
          center={m(total)}
          data={channels.map((c, i) => ({
            name: c.label,
            value: num(c.revenue),
            color: `hsl(var(--chart-${(i % 5) + 1}))`,
          }))}
          formatValue={m}
        />
        <StackedBarChart
          title="Kanal kıyası"
          description="Ciro karşılaştırması"
          stacked={false}
          data={channels.map((c) => ({
            label: c.label,
            revenue: num(c.revenue),
            orders: c.orderCount ?? 0,
          }))}
          series={[
            { key: "revenue", label: "Ciro", color: CHART_COLORS.c1 },
            { key: "orders", label: "Sipariş", color: CHART_COLORS.c2 },
          ]}
        />
      </div>
      {dailyStacked.length > 0 ? (
        <StackedBarChart
          title="Günlük kanal yığını"
          data={dailyStacked}
          series={codes.map((code, i) => ({
            key: code,
            label: channels.find((c) => c.code === code)?.label ?? code,
            color: `hsl(var(--chart-${(i % 5) + 1}))`,
          }))}
        />
      ) : null}
    </div>
  );
}

function ProductsSection({
  revenue,
  money: m,
}: {
  revenue: MenuRevenueReportResponse;
  money: (v: number) => string;
}) {
  const products = revenue.products ?? [];
  const categories = revenue.categories ?? [];
  const topProducts = products.slice(0, 6);
  const peakProduct = Math.max(...topProducts.map((p) => num(p.revenue)), 1);
  const catTotal = categories.reduce((s, c) => s + num(c.revenue), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {topProducts.slice(0, 4).map((p) => (
          <MetricTile
            key={p.name}
            label={p.name}
            value={m(num(p.revenue))}
            hint={`${p.quantity.toLocaleString("tr-TR")} adet`}
          />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <RankListCard
          title="Top ürünler"
          items={topProducts.map((p, i) => ({
            name: p.name,
            value: m(num(p.revenue)),
            active: i === 0,
            share: (num(p.revenue) / peakProduct) * 100,
          }))}
        />
        <HighlightBarChart
          title="Kategori cirosu"
          value={m(catTotal)}
          data={categories.slice(0, 8).map((c) => ({
            label: c.name.slice(0, 12),
            value: num(c.revenue),
          }))}
        />
      </div>
      <SharePieChart
        title="Kategori payı"
        center={`${categories.length} kat.`}
        data={categories.slice(0, 6).map((c, i) => ({
          name: c.name,
          value: num(c.revenue),
          color: `hsl(var(--chart-${(i % 5) + 1}))`,
        }))}
        formatValue={m}
      />
    </div>
  );
}

function TrafficSection({
  visits,
  grain,
}: {
  visits: MenuAnalyticsReportResponse;
  grain: "daily" | "hourly";
}) {
  const daily = visits.daily ?? [];
  const dual = daily.map((d) => ({
    label: dayLabel(d.date),
    opens: d.menuOpens,
    products: d.productViews,
  }));
  const devices = visits.devices ?? [];
  const sparkOpens = daily.map((d) => d.menuOpens);
  const sparkProducts = daily.map((d) => d.productViews);
  const sparkSessions = daily.map((d) => d.sessions);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricTile
          label="Menü açılış"
          value={(visits.funnel?.menuOpens ?? visits.kpis.menuOpens).toLocaleString("tr-TR")}
          spark={sparkOpens}
          sparkColor={CHART_COLORS.c1}
        />
        <MetricTile
          label="Ürün görüntüleme"
          value={(visits.funnel?.productViews ?? visits.kpis.productViews).toLocaleString("tr-TR")}
          spark={sparkProducts}
          sparkColor={CHART_COLORS.c2}
        />
        <MetricTile
          label="Oturum"
          value={visits.kpis.sessions.toLocaleString("tr-TR")}
          spark={sparkSessions}
          sparkColor={CHART_COLORS.c3}
        />
        <MetricTile
          label="Cihaz türü"
          value={String(devices.length)}
          hint={devices[0] ? `Lider: ${devices[0].name}` : undefined}
        />
      </div>
      <DropoffFunnelChart
        title="Trafik hunisi"
        description="Menüden ürüne dönüşüm"
        stages={[
          { label: "Menü açılış", value: visits.funnel?.menuOpens ?? visits.kpis.menuOpens },
          {
            label: "Kategori",
            value: visits.funnel?.categoryViews ?? visits.kpis.categoryViews,
          },
          {
            label: "Ürün",
            value: visits.funnel?.productViews ?? visits.kpis.productViews,
          },
          { label: "Oturum", value: visits.kpis.sessions },
        ]}
        exploreHint="Drop-off hangi cihazda artıyor? Cihaz payına bak."
      />
      <div className="grid gap-3 lg:grid-cols-2">
        <TrendAreaChart
          title="Trafik seyri"
          data={dual}
          series={[
            { key: "opens", label: "Menü", color: CHART_COLORS.c1 },
            { key: "products", label: "Ürün", color: CHART_COLORS.c2 },
          ]}
        />
        <SharePieChart
          title="Cihaz dağılımı"
          data={devices.map((d, i) => ({
            name: d.name,
            value: d.value,
            color: `hsl(var(--chart-${(i % 5) + 1}))`,
          }))}
        />
      </div>
      <HighlightBarChart
        title={grain === "hourly" ? "Saatlik görüntülenme" : "Günlük oturum"}
        value={String(visits.kpis.sessions)}
        data={
          grain === "hourly" && (visits.hourly?.length ?? 0) > 0
            ? (visits.hourly ?? []).map((h) => ({ label: `${h.hour}`, value: h.views }))
            : daily.map((d) => ({ label: dayLabel(d.date), value: d.sessions }))
        }
      />
    </div>
  );
}

function StaffSection({
  waiter,
  money: m,
}: {
  waiter: MenuWaiterPerformanceReportResponse;
  money: (v: number) => string;
}) {
  const waiters = waiter.waiters ?? [];
  const maxRev = Math.max(...waiters.map((w) => num(w.revenue)), 1);
  const top = waiters.slice(0, 3);
  const sparkRevenue = (waiter.daily ?? []).map((d) => num(d.revenue));
  const sparkOrders = (waiter.daily ?? []).map((d) => d.orderCount ?? 0);

  return (
    <div className="space-y-4">
      <KpiStatCards
        items={[
          {
            id: "active",
            label: "Aktif personel",
            value: String(waiter.kpis.activeWaiterCount ?? 0),
            progress: Math.min(100, (waiter.kpis.activeWaiterCount ?? 0) * 12),
            color: CHART_COLORS.c1,
          },
          {
            id: "rev",
            label: "Personel cirosu",
            value: m(num(waiter.kpis.totalRevenue)),
            color: CHART_COLORS.c4,
            spark: sparkRevenue,
          },
          {
            id: "tip",
            label: "Bahşiş",
            value: m(num(waiter.kpis.totalTip)),
            progress: 48,
            color: CHART_COLORS.c5,
          },
          {
            id: "assigned",
            label: "Atanmış sipariş",
            value: String(waiter.kpis.assignedOrderCount ?? 0),
            color: CHART_COLORS.c2,
            spark: sparkOrders,
          },
        ]}
      />
      <div className="grid gap-3 lg:grid-cols-2">
        <RankListCard
          title="Garson sıralaması"
          items={waiters.slice(0, 6).map((w, i) => ({
            name: w.displayName,
            value: m(num(w.revenue)),
            active: i === 0,
            share: (num(w.revenue) / maxRev) * 100,
          }))}
        />
        <RadarCompareChart
          title="Üst profil kıyası"
          axes={["Ciro", "Sipariş", "Bahşiş", "Komisyon", "Pay"]}
          series={top.map((w) => ({
            name: w.displayName,
            values: [
              (num(w.revenue) / maxRev) * 100,
              Math.min(100, (w.orderCount ?? 0) * 8),
              Math.min(100, num(w.tipAmount) / 10),
              Math.min(100, num(w.commissionAmount) / 10),
              num(w.revenueSharePercent) || 40,
            ],
          }))}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {top.map((w, i) => (
          <RadialProgressChart
            key={w.waiterId ?? w.displayName}
            title={w.displayName}
            percent={(num(w.revenue) / maxRev) * 100}
            centerLabel={m(num(w.revenue))}
            color={`hsl(var(--chart-${(i % 5) + 1}))`}
          />
        ))}
      </div>
    </div>
  );
}

function InsightsSection({
  result,
  compact,
}: {
  result?: SmartReportResult | null;
  compact?: boolean;
}) {
  if (!result) {
    return <ReportEmpty text="AI bölümleri henüz hazır değil." />;
  }
  if (result.sections?.length) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {result.sections.map((section, index) => (
          <Card
            key={section.heading}
            className={cn(
              "rounded-2xl shadow-sm",
              index === 0 && "border-primary/30 bg-primary/5 md:col-span-2",
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{section.heading}</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground",
                  compact && "line-clamp-6",
                )}
              >
                {section.body}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  const body = result.rawMarkdown?.trim() || result.summary?.trim();
  if (!body) {
    return <ReportEmpty text="AI bölümleri henüz hazır değil." />;
  }
  return (
    <Card className="rounded-2xl border-primary/30 bg-primary/5 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{result.title || "Akıllı Rapor"}</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground",
            compact && "line-clamp-10",
          )}
        >
          {body}
        </p>
      </CardContent>
    </Card>
  );
}
