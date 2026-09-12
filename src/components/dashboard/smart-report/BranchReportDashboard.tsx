"use client";

import { useMemo, useState } from "react";
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
  money,
  num,
} from "./chart-config";
import { ReportEmpty, ReportSkeleton } from "./ReportChartCard";
import { CategorySalesCard } from "./charts/CategorySalesCard";
import { HighlightBarChart } from "./charts/HighlightBarChart";
import { RankListCard } from "./charts/RadialProgressChart";
import { SharePieChart } from "./charts/SharePieChart";
import { StackedBarChart } from "./charts/StackedBarChart";
import { MetricTile } from "./charts/ZentraOverview";
import TrafficSection from "./TrafficSection";
import { CiroPage } from "./ciro-layout";
import { readCiroMetrics } from "./ciro-metrics";
import { buildCategorySales } from "./shadcn-spark";
import { StaffPage } from "./staff-layout";

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

  const [tab, setTab] = useState<TabId | null>(null);
  const activeTab =
    tab && tabs.some((item) => item.id === tab)
      ? tab
      : initialTab && tabs.some((item) => item.id === initialTab)
        ? initialTab
        : (tabs[0]?.id ?? "overview");
  const ciroFlat = Boolean(
    allowedTabs?.includes("overview") &&
      allowedTabs?.includes("channels") &&
      allowedTabs?.includes("products"),
  );

  if (loading && !revenue) {
    return <ReportSkeleton rows={6} />;
  }

  if (!revenue) {
    if (result) {
      return <InsightsSection result={result} compact={compact} />;
    }
    return <ReportEmpty text="Rapor verisi yüklenemedi." />;
  }

  const currency = readCiroMetrics(revenue).currency;
  const m = (v: number) => money(v, currency);

  if (ciroFlat) {
    return (
      <div className="space-y-4">
        <CiroPage revenue={revenue} money={m} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tabs.length > 1 ? (
        <SlidingTabSelect
          value={activeTab}
          onValueChange={(next) => setTab(next as TabId)}
          items={tabs.map((item) => ({ value: item.id, label: item.label }))}
          size="sm"
          variant="soft"
          className="w-full overflow-x-auto"
          ariaLabel="Rapor sekmeleri"
        />
      ) : null}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "overview" || activeTab === "revenue" ? (
            <CiroPage revenue={revenue} money={m} />
          ) : null}
          {activeTab === "channels" ? (
            <ChannelsSection revenue={revenue} money={m} />
          ) : null}
          {activeTab === "products" ? (
            <ProductsSection revenue={revenue} money={m} />
          ) : null}
          {activeTab === "traffic" ? (
            visits ? (
              <TrafficSection visits={visits} revenue={revenue} />
            ) : (
              <ReportEmpty text="Trafik verisi yok." />
            )
          ) : null}
          {activeTab === "staff" ? (
            waiter ? (
              <StaffPage waiter={waiter} money={m} />
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
  const categorySales = buildCategorySales(revenue, undefined, m);

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
      <CategorySalesCard
        title="Kategori"
        compact={categorySales.compact}
        delta={categorySales.delta}
        slices={categorySales.slices}
      />
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
