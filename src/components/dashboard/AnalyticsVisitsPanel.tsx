"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  Layers,
  ShoppingBag,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from "recharts";

import { SlidingTabSelect } from "@/components/ui/sliding-tab-select";
import { useIsMobile } from "@/hooks/use-mobile";
import type { MenuAnalyticsReportResponse } from "@/lib/api";
import { buildVisitReportView, type VisitKpiId } from "@/reporting";
import { cn } from "@/lib/utils";

const c = (token: string) => `hsl(var(--chart-${token}))`;

const COLORS = {
  green: c("green"),
  indigo: c("indigo"),
  teal: c("teal"),
  violet: c("violet"),
  orange: c("orange"),
};

const DEVICE_FILLS = [COLORS.indigo, COLORS.orange, COLORS.teal];
const gridStroke = "hsl(0 0% 15%)";
const axisStroke = "hsl(0 0% 40%)";

const VISIT_KPI_ICONS: Record<VisitKpiId, LucideIcon> = {
  sessions: Users,
  menuOpens: Eye,
  productViews: ShoppingBag,
  averageProductsPerSession: Layers,
};

const VISIT_KPI_COLORS: Record<VisitKpiId, string> = {
  sessions: COLORS.indigo,
  menuOpens: COLORS.teal,
  productViews: COLORS.green,
  averageProductsPerSession: COLORS.orange,
};

const MOBILE_SECTIONS = [
  { value: "ozet", label: "Özet" },
  { value: "trend", label: "Trend" },
  { value: "urun", label: "Ürün" },
] as const;

type MobileSection = (typeof MOBILE_SECTIONS)[number]["value"];

const CHART_TABS = [
  { value: "daily", label: "Günlük" },
  { value: "hourly", label: "Saatlik" },
  { value: "device", label: "Cihaz" },
  { value: "funnel", label: "Funnel" },
] as const;

type ChartTab = (typeof CHART_TABS)[number]["value"];

const PRODUCT_TABS = [
  { value: "products", label: "Ürünler" },
  { value: "categories", label: "Kategori" },
  { value: "tree", label: "Yoğunluk" },
] as const;

type ProductTab = (typeof PRODUCT_TABS)[number]["value"];

function TreemapContent(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  index?: number;
}) {
  const { x = 0, y = 0, width = 0, height = 0, name = "", index = 0 } = props;
  if (width < 40 || height < 24) return null;
  const fills = [COLORS.indigo, COLORS.teal, COLORS.green, COLORS.violet, COLORS.orange];
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{ fill: fills[index % fills.length], stroke: "hsl(var(--background))", strokeWidth: 2 }}
        rx={4}
      />
      <text x={x + 8} y={y + 18} fill="white" fontSize={11}>
        {name}
      </text>
    </g>
  );
}

function ViewsRankedList({
  title,
  rows,
  limit,
}: {
  title: string;
  rows: { name: string; views: number }[];
  limit?: number;
}) {
  const visible = limit ? rows.slice(0, limit) : rows;
  const max = Math.max(...visible.map((row) => row.views), 1);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <ul className="divide-y divide-border">
        {visible.map((row, index) => (
          <li key={`${row.name}-${index}`} className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">{index + 1}</span>
                <span className="truncate text-sm font-medium text-foreground">{row.name}</span>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {row.views.toLocaleString("tr-TR")}
              </span>
            </div>
            <div className="mt-2 pl-7">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/80"
                  style={{ width: `${Math.min(100, (row.views / max) * 100)}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AnalyticsVisitsPanel({
  report,
  tooltipStyle,
}: {
  report: MenuAnalyticsReportResponse | undefined;
  tooltipStyle: Record<string, string>;
}) {
  const isMobile = useIsMobile();
  const [section, setSection] = useState<MobileSection>("ozet");
  const [chartTab, setChartTab] = useState<ChartTab>("daily");
  const [productTab, setProductTab] = useState<ProductTab>("products");

  const visit = buildVisitReportView(report);
  const devices = visit.devices.map((d, i) => ({
    ...d,
    fill: DEVICE_FILLS[i % DEVICE_FILLS.length],
  }));
  const kpis = visit.kpis.map((m) => ({
    ...m,
    icon: VISIT_KPI_ICONS[m.id],
    color: VISIT_KPI_COLORS[m.id],
  }));

  if (visit.empty) {
    return (
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 text-sm text-muted-foreground shadow-none dark:border-border dark:bg-card">
        Seçilen dönemde henüz ziyaret verisi yok. Public menü taramaları burada görünecek.
      </div>
    );
  }

  const overview = (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-2xl border border-[#e5e7eb] bg-white text-card-foreground shadow-none dark:border-border dark:bg-card"
          >
            <div className={cn("flex flex-col", isMobile ? "gap-1.5 p-3.5" : "p-5")}>
              <m.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: m.color }} />
              <p
                className={cn(
                  "font-semibold tracking-tight text-foreground",
                  isMobile ? "text-lg" : "mt-3 text-2xl",
                )}
              >
                {m.display}
              </p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {isMobile ? (
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 dark:border-border dark:bg-card">
          <p className="mb-3 text-xs font-medium text-muted-foreground">Funnel</p>
          <div className="grid grid-cols-3 gap-2">
            {visit.funnel.map((step) => (
              <div key={step.name} className="rounded-xl bg-muted/40 px-2.5 py-2 text-center">
                <p className="text-[11px] text-muted-foreground">{step.name}</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                  {step.value.toLocaleString("tr-TR")}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  const dailyChart = (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-none dark:border-border dark:bg-card sm:p-6">
      {!isMobile ? (
        <h2 className="mb-4 text-base font-semibold text-foreground">Günlük oturum & görüntüleme</h2>
      ) : null}
      <div className={isMobile ? "h-56" : "h-72"}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visit.daily}>
            <defs>
              <linearGradient id="gradSessions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.indigo} stopOpacity={0.25} />
                <stop offset="100%" stopColor={COLORS.indigo} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradOpens" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.teal} stopOpacity={0.2} />
                <stop offset="100%" stopColor={COLORS.teal} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="dateLabel"
              stroke={axisStroke}
              fontSize={isMobile ? 10 : 12}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke={axisStroke}
              fontSize={isMobile ? 10 : 12}
              tickLine={false}
              axisLine={false}
              width={isMobile ? 28 : 40}
            />
            <Tooltip contentStyle={tooltipStyle} />
            {!isMobile ? <Legend /> : null}
            <Area
              type="monotone"
              dataKey="sessions"
              name="Oturum"
              stroke={COLORS.indigo}
              strokeWidth={2}
              fill="url(#gradSessions)"
            />
            <Area
              type="monotone"
              dataKey="menuOpens"
              name="Menü açılışı"
              stroke={COLORS.teal}
              strokeWidth={2}
              fill="url(#gradOpens)"
            />
            <Area
              type="monotone"
              dataKey="productViews"
              name="Ürün"
              stroke={COLORS.green}
              strokeWidth={1.5}
              fill="transparent"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const hourlyChart = (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-none dark:border-border dark:bg-card sm:p-6">
      {!isMobile ? <h2 className="mb-4 text-base font-semibold text-foreground">Saatlik yoğunluk</h2> : null}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={visit.hourly}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="hour" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              stroke={axisStroke}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={isMobile ? 28 : 40}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="views" name="Görüntüleme" fill={COLORS.green} radius={[4, 4, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const deviceChart = (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-none dark:border-border dark:bg-card sm:p-6">
      {!isMobile ? <h2 className="mb-4 text-base font-semibold text-foreground">Cihaz dağılımı</h2> : null}
      <div className={cn("flex items-center", isMobile ? "h-52 flex-col gap-3" : "h-56")}>
        <ResponsiveContainer width="100%" height={isMobile ? "70%" : "100%"}>
          <PieChart>
            <Pie
              data={devices}
              cx="50%"
              cy="50%"
              innerRadius={isMobile ? 42 : 55}
              outerRadius={isMobile ? 64 : 80}
              paddingAngle={4}
              dataKey="value"
            >
              {devices.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className={cn("space-y-2", isMobile ? "flex w-full flex-wrap justify-center gap-x-4 gap-y-2 space-y-0" : "min-w-[120px] space-y-3")}>
          {devices.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
              <span className="text-xs text-muted-foreground">{d.name}</span>
              <span className="ml-auto text-xs font-medium text-foreground">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const funnelChart = (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-none dark:border-border dark:bg-card sm:p-6">
      {!isMobile ? (
        <h2 className="mb-4 text-base font-semibold text-foreground">Funnel: menü → kategori → ürün</h2>
      ) : null}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={visit.funnel}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="name" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              stroke={axisStroke}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={isMobile ? 28 : 40}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" name="Adım" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const productChart = (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-none dark:border-border dark:bg-card sm:p-6">
      {!isMobile ? (
        <h2 className="mb-4 text-base font-semibold text-foreground">En çok görüntülenen ürünler</h2>
      ) : null}
      <div className={isMobile ? "h-56" : "h-64"}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[...visit.topProducts].reverse()}
            layout="vertical"
            margin={{ left: isMobile ? 4 : 16 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis type="number" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={isMobile ? 72 : 110}
              stroke={axisStroke}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="views" name="Görüntüleme" fill={COLORS.indigo} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const categoryChart = (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-none dark:border-border dark:bg-card sm:p-6">
      {!isMobile ? (
        <h2 className="mb-4 text-base font-semibold text-foreground">En çok görüntülenen kategoriler</h2>
      ) : null}
      <div className={isMobile ? "h-56" : "h-64"}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={visit.topCategories}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="name"
              stroke={axisStroke}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={isMobile ? -25 : 0}
              textAnchor={isMobile ? "end" : "middle"}
              height={isMobile ? 48 : 30}
            />
            <YAxis
              stroke={axisStroke}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={isMobile ? 28 : 40}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="views" name="Görüntüleme" fill={COLORS.violet} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const treeChart = (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-none dark:border-border dark:bg-card sm:p-6">
      {!isMobile ? (
        <h2 className="mb-4 text-base font-semibold text-foreground">Kategori → ürün yoğunluk</h2>
      ) : null}
      <div className={isMobile ? "h-56" : "h-64"}>
        {visit.treeData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={visit.treeData}
              dataKey="size"
              nameKey="name"
              stroke="hsl(var(--background))"
              content={<TreemapContent />}
            />
          </ResponsiveContainer>
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">Veri yok</p>
        )}
      </div>
    </div>
  );

  const trends = isMobile ? (
    <div className="space-y-3">
      <SlidingTabSelect
        items={[...CHART_TABS]}
        value={chartTab}
        onValueChange={(v) => setChartTab(v as ChartTab)}
        variant="soft"
        size="sm"
        className="w-full justify-start overflow-x-auto"
        ariaLabel="Ziyaret grafikleri"
      />
      {
        (
          {
            daily: dailyChart,
            hourly: hourlyChart,
            device: deviceChart,
            funnel: funnelChart,
          } as Record<ChartTab, ReactNode>
        )[chartTab]
      }
    </div>
  ) : (
    <div className="space-y-6">
      {dailyChart}
      <div className="grid gap-6 lg:grid-cols-2">
        {hourlyChart}
        {deviceChart}
      </div>
    </div>
  );

  const products = isMobile ? (
    <div className="space-y-3">
      <SlidingTabSelect
        items={[...PRODUCT_TABS]}
        value={productTab}
        onValueChange={(v) => setProductTab(v as ProductTab)}
        variant="soft"
        size="sm"
        className="w-full justify-start overflow-x-auto"
        ariaLabel="Ürün görünümleri"
      />
      {productTab === "products" ? (
        <ViewsRankedList title="En çok görüntülenen ürünler" rows={visit.topProducts} limit={12} />
      ) : null}
      {productTab === "categories" ? (
        <ViewsRankedList title="En çok görüntülenen kategoriler" rows={visit.topCategories} />
      ) : null}
      {productTab === "tree" ? treeChart : null}
    </div>
  ) : (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {productChart}
        {categoryChart}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {treeChart}
        {funnelChart}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="space-y-4">
        <SlidingTabSelect
          items={[...MOBILE_SECTIONS]}
          value={section}
          onValueChange={(v) => setSection(v as MobileSection)}
          variant="nav"
          size="sm"
          className="w-full"
          ariaLabel="Ürün ve ziyaret bölümleri"
        />
        {section === "ozet" ? overview : null}
        {section === "trend" ? trends : null}
        {section === "urun" ? products : null}
      </div>
    );
  }

  return (
    <>
      {overview}
      {trends}
      {products}
    </>
  );
}
