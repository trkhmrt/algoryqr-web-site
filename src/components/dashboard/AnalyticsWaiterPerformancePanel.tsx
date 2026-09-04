"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  Coins,
  Package,
  Receipt,
  ShoppingBag,
  UserCheck,
  UserX,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMenuPrice } from "@/components/menu-templates/types";
import { SlidingTabSelect } from "@/components/ui/sliding-tab-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import type { MenuWaiterPerformanceReportResponse } from "@/lib/api";
import {
  WAITER_FILTER_ALL,
  buildWaiterPerformanceReportView,
  filterWaiterPerformanceReportView,
  type WaiterPerformanceKpiId,
} from "@/reporting";
import { cn } from "@/lib/utils";

const c = (token: string) => `hsl(var(--chart-${token}))`;

const COLORS = {
  green: c("green"),
  indigo: c("indigo"),
  teal: c("teal"),
  orange: c("orange"),
  violet: c("violet"),
};

const KPI_ICONS: Record<WaiterPerformanceKpiId, LucideIcon> = {
  activeWaiterCount: Users,
  assignedOrderCount: UserCheck,
  unassignedOrderCount: UserX,
  totalRevenue: Banknote,
  soldItemCount: ShoppingBag,
  totalCommission: Coins,
  totalTip: Coins,
  billsClosedCount: Receipt,
};

const KPI_COLORS: Record<WaiterPerformanceKpiId, string> = {
  activeWaiterCount: COLORS.indigo,
  assignedOrderCount: COLORS.teal,
  unassignedOrderCount: COLORS.orange,
  totalRevenue: COLORS.green,
  soldItemCount: COLORS.violet,
  totalCommission: COLORS.orange,
  totalTip: COLORS.teal,
  billsClosedCount: COLORS.indigo,
};

const MOBILE_SECTIONS = [
  { value: "ozet", label: "Özet" },
  { value: "trend", label: "Trend" },
  { value: "detay", label: "Detay" },
] as const;

type MobileSection = (typeof MOBILE_SECTIONS)[number]["value"];

const CHART_TABS = [
  { value: "daily", label: "Günlük" },
  { value: "personnel", label: "Personel" },
  { value: "hourly", label: "Saatlik" },
  { value: "products", label: "Ürün" },
] as const;

type ChartTab = (typeof CHART_TABS)[number]["value"];

export default function AnalyticsWaiterPerformancePanel({
  report,
  tooltipStyle,
}: {
  report: MenuWaiterPerformanceReportResponse;
  tooltipStyle: Record<string, string>;
}) {
  const isMobile = useIsMobile();
  const baseView = useMemo(() => buildWaiterPerformanceReportView(report), [report]);
  const [waiterFilter, setWaiterFilter] = useState(WAITER_FILTER_ALL);
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [section, setSection] = useState<MobileSection>("ozet");
  const [chartTab, setChartTab] = useState<ChartTab>("daily");

  const filterOptions = useMemo(
    () =>
      baseView.rows.map((row) => ({
        value: row.key,
        label: row.displayName,
      })),
    [baseView.rows],
  );

  const activeFilter =
    waiterFilter === WAITER_FILTER_ALL || filterOptions.some((option) => option.value === waiterFilter)
      ? waiterFilter
      : WAITER_FILTER_ALL;

  const view = useMemo(
    () => filterWaiterPerformanceReportView(baseView, activeFilter),
    [baseView, activeFilter],
  );

  const { currency, empty, rows, chartData, daily, hourly, products } = view;
  const isFiltered = activeFilter !== WAITER_FILTER_ALL;
  const kpis = view.kpis.map((m) => ({
    ...m,
    icon: KPI_ICONS[m.id],
    color: KPI_COLORS[m.id],
    display: m.unit === "money" ? formatMenuPrice(m.value, currency) : m.display,
  }));
  const revenueKpi = kpis.find((m) => m.id === "totalRevenue");

  if (baseView.empty) {
    return (
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 text-sm text-muted-foreground shadow-none dark:border-border dark:bg-card">
        Seçilen dönemde personel performans verisi yok. Garson kayıtları oluşturup siparişler onaylandıkça
        burada görünür.
      </div>
    );
  }

  const filterBar = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">Personel filtresi</p>
        {!isMobile ? (
          <p className="text-xs text-muted-foreground">
            Tek personel seçince ciro, ürün ve komisyon metrikleri o kişiye göre daralır.
          </p>
        ) : null}
      </div>
      <Select
        value={activeFilter}
        onValueChange={(next) => {
          setWaiterFilter(next);
          setExpandedRowKey(null);
        }}
      >
        <SelectTrigger
          aria-label="Personel filtresi"
          className="w-full rounded-xl border border-border/50 bg-white px-2.5 py-1.5 shadow-sm transition-colors/60 sm:w-[240px] dark:bg-muted/60"
        >
          <SelectValue placeholder="Tüm personel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={WAITER_FILTER_ALL}>Tüm personel</SelectItem>
          {filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  if (empty) {
    return (
      <div className="space-y-4">
        {filterBar}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 text-sm text-muted-foreground shadow-none dark:border-border dark:bg-card">
          Seçilen personel için bu dönemde veri yok.
        </div>
      </div>
    );
  }

  const overview = (
    <div className="space-y-4 md:space-y-6">
      {isMobile && revenueKpi ? (
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 dark:border-border dark:bg-card">
          <p className="text-xs font-medium text-muted-foreground">{revenueKpi.label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
            {revenueKpi.display}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        {kpis.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={cn(
              "rounded-2xl border border-[#e5e7eb] bg-white text-card-foreground shadow-none dark:border-border dark:bg-card",
              isMobile && m.id === "totalRevenue" && "hidden",
            )}
          >
            <div className={cn("flex flex-col", isMobile ? "gap-1.5 p-3.5" : "gap-3 p-5")}>
              <div className="flex items-center gap-2">
                <m.icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" style={{ color: m.color }} />
                <p className="text-xs font-semibold leading-tight text-muted-foreground sm:text-sm sm:text-foreground">
                  {m.label}
                </p>
              </div>
              <p className="text-base font-semibold tracking-tight tabular-nums text-foreground sm:text-lg">
                {m.display}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const dailyChart =
    !isFiltered && daily.length > 0 ? (
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-none dark:border-border dark:bg-card sm:p-6">
        {!isMobile ? (
          <h2 className="mb-4 text-base font-semibold text-foreground">Günlük personel cirosu</h2>
        ) : null}
        <div className={isMobile ? "h-56" : "h-72"}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="gradWaiterRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.indigo} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={COLORS.indigo} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
              <XAxis
                dataKey="dateLabel"
                stroke="hsl(0 0% 40%)"
                fontSize={isMobile ? 10 : 12}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="hsl(0 0% 40%)"
                fontSize={isMobile ? 10 : 12}
                tickLine={false}
                axisLine={false}
                width={isMobile ? 36 : 60}
                tickFormatter={(value) => formatMenuPrice(value, currency)}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => {
                  if (name === "revenue") {
                    return [formatMenuPrice(Number(value), currency), "Ciro"];
                  }
                  return [Number(value).toLocaleString("tr-TR"), "Sipariş"];
                }}
              />
              {!isMobile ? <Legend /> : null}
              <Area
                type="monotone"
                dataKey="revenue"
                name="Ciro"
                stroke={COLORS.indigo}
                strokeWidth={2}
                fill="url(#gradWaiterRevenue)"
              />
              <Area
                type="monotone"
                dataKey="orderCount"
                name="Sipariş"
                stroke={COLORS.teal}
                strokeWidth={1.5}
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    ) : null;

  const personnelChart =
    chartData.length > 0 ? (
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-none dark:border-border dark:bg-card sm:p-6">
        {!isMobile ? (
          <h2 className="mb-4 text-base font-semibold text-foreground">
            {isFiltered ? "Seçilen personel cirosu" : "Personel bazlı ciro"}
          </h2>
        ) : null}
        <div className={isMobile ? "h-56" : "h-72"}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: isMobile ? 40 : 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
              <XAxis
                dataKey="name"
                stroke="hsl(0 0% 40%)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={isMobile ? 48 : 60}
              />
              <YAxis
                stroke="hsl(0 0% 40%)"
                fontSize={isMobile ? 10 : 12}
                tickLine={false}
                axisLine={false}
                width={isMobile ? 36 : 60}
                tickFormatter={(value) => formatMenuPrice(value, currency)}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => {
                  if (name === "revenue") {
                    return [formatMenuPrice(Number(value), currency), "Ciro"];
                  }
                  if (name === "itemCount") {
                    return [Number(value).toLocaleString("tr-TR"), "Ürün adedi"];
                  }
                  return [Number(value).toLocaleString("tr-TR"), "Sipariş"];
                }}
              />
              <Bar dataKey="revenue" name="revenue" fill={COLORS.indigo} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    ) : null;

  const hourlyChart =
    !isFiltered && hourly.length > 0 ? (
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-none dark:border-border dark:bg-card sm:p-6">
        {!isMobile ? (
          <h2 className="mb-4 text-base font-semibold text-foreground">Saatlik sipariş yoğunluğu</h2>
        ) : null}
        <div className={isMobile ? "h-56" : "h-72"}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
              <XAxis dataKey="hour" stroke="hsl(0 0% 40%)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke="hsl(0 0% 40%)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={isMobile ? 28 : 40}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="orderCount" name="Sipariş" fill={COLORS.teal} radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    ) : null;

  const productsChart =
    products.length > 0 ? (
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-none dark:border-border dark:bg-card sm:p-6">
        {!isMobile ? (
          <h2 className="mb-4 text-base font-semibold text-foreground">
            {isFiltered ? "En çok sattığı ürünler" : "Personel satışlarındaki en çok satılan ürünler"}
          </h2>
        ) : null}
        <div className={isMobile ? "h-56" : "h-64"}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...products].reverse()} layout="vertical" margin={{ left: isMobile ? 4 : 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
              <XAxis type="number" stroke="hsl(0 0% 40%)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={isMobile ? 72 : 120}
                stroke="hsl(0 0% 40%)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="quantity" name="Adet" fill={COLORS.violet} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    ) : null;

  const availableChartTabs = CHART_TABS.filter((tab) => {
    if (tab.value === "daily") return Boolean(dailyChart);
    if (tab.value === "personnel") return Boolean(personnelChart);
    if (tab.value === "hourly") return Boolean(hourlyChart);
    return Boolean(productsChart);
  });

  const activeChartTab =
    availableChartTabs.some((tab) => tab.value === chartTab)
      ? chartTab
      : (availableChartTabs[0]?.value ?? "personnel");

  const chartByTab: Record<ChartTab, ReactNode> = {
    daily: dailyChart,
    personnel: personnelChart,
    hourly: hourlyChart,
    products: productsChart,
  };

  const trends = isMobile ? (
    <div className="space-y-3">
      {availableChartTabs.length > 0 ? (
        <>
          <SlidingTabSelect
            items={[...availableChartTabs]}
            value={activeChartTab}
            onValueChange={(v) => setChartTab(v as ChartTab)}
            variant="soft"
            size="sm"
            className="w-full justify-start overflow-x-auto"
            ariaLabel="Personel grafikleri"
          />
          {chartByTab[activeChartTab]}
        </>
      ) : (
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 text-sm text-muted-foreground dark:border-border dark:bg-card">
          Bu filtre için gösterilecek grafik yok.
        </div>
      )}
    </div>
  ) : (
    <div className="space-y-6">
      {dailyChart}
      <div className={`grid gap-6 ${!isFiltered && hourly.length > 0 ? "lg:grid-cols-2" : ""}`}>
        {personnelChart}
        {hourlyChart}
      </div>
      {productsChart}
    </div>
  );

  const details = isMobile ? (
    <PersonnelMobileList
      rows={rows}
      currency={currency}
      expandedRowKey={expandedRowKey}
      onToggle={(key) => setExpandedRowKey(expandedRowKey === key ? null : key)}
    />
  ) : (
    <PersonnelDesktopTable
      rows={rows}
      currency={currency}
      expandedRowKey={expandedRowKey}
      onToggle={(key) => setExpandedRowKey(expandedRowKey === key ? null : key)}
    />
  );

  if (isMobile) {
    return (
      <div className="space-y-4">
        {filterBar}
        <SlidingTabSelect
          items={[...MOBILE_SECTIONS]}
          value={section}
          onValueChange={(v) => setSection(v as MobileSection)}
          variant="nav"
          size="sm"
          className="w-full"
          ariaLabel="Personel bölümleri"
        />
        {section === "ozet" ? overview : null}
        {section === "trend" ? trends : null}
        {section === "detay" ? details : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filterBar}
      {overview}
      {trends}
      {details}
    </div>
  );
}

type WaiterRow = ReturnType<typeof buildWaiterPerformanceReportView>["rows"][number];

function PersonnelMobileList({
  rows,
  currency,
  expandedRowKey,
  onToggle,
}: {
  rows: WaiterRow[];
  currency: string;
  expandedRowKey: string | null;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white dark:border-border dark:bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Personel performansı</h2>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((row) => {
          const expanded = expandedRowKey === row.key;
          return (
            <li key={row.key}>
              <button
                type="button"
                className="w-full px-4 py-3 text-left"
                onClick={() => onToggle(row.key)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{row.displayName}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {!row.unassigned && !row.active ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          Pasif
                        </span>
                      ) : null}
                      {row.unassigned ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          Atanmamış
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatMenuPrice(row.revenue, currency)}
                  </p>
                </div>
                <p className="mt-2 text-[11px] tabular-nums text-muted-foreground">
                  {row.orderCount.toLocaleString("tr-TR")} sipariş ·{" "}
                  {row.itemCount.toLocaleString("tr-TR")} ürün · Bahşiş{" "}
                  {formatMenuPrice(row.tipAmount, currency)} · Komisyon{" "}
                  {formatMenuPrice(row.commissionAmount, currency)}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/80"
                      style={{ width: `${Math.min(100, Math.max(0, row.revenueSharePercent))}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                    %{row.revenueSharePercent.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </button>
              {expanded && row.topProducts.length > 0 ? (
                <div className="space-y-2 border-t border-border/60 bg-muted/10 px-4 py-3">
                  <p className="text-[11px] font-medium text-muted-foreground">En çok sattığı ürünler</p>
                  {row.topProducts.map((product) => (
                    <div
                      key={product.key}
                      className="rounded-xl border border-border/50 bg-white px-2.5 py-1.5 dark:bg-muted/60"
                    >
                      <p className="text-sm font-medium text-foreground">{product.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {product.quantity.toLocaleString("tr-TR")} adet ·{" "}
                        {formatMenuPrice(product.revenue, currency)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PersonnelDesktopTable({
  rows,
  currency,
  expandedRowKey,
  onToggle,
}: {
  rows: WaiterRow[];
  currency: string;
  expandedRowKey: string | null;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-base font-semibold text-foreground">Personel performans tablosu</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Onaylanmış siparişler, garson atamasına göre gruplanır. Satır detayında personelin en çok sattığı ürünler
          görünür.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
              <th className="px-6 py-3 font-medium">Personel</th>
              <th className="px-4 py-3 font-medium">Sipariş</th>
              <th className="px-4 py-3 font-medium">Ürün adedi</th>
              <th className="px-4 py-3 font-medium">Ciro</th>
              <th className="px-4 py-3 font-medium">Bahşiş</th>
              <th className="px-4 py-3 font-medium">Komisyon</th>
              <th className="px-4 py-3 font-medium">Adisyon</th>
              <th className="px-4 py-3 font-medium">Ort. sepet</th>
              <th className="px-4 py-3 font-medium">Ciro payı</th>
              <th className="px-4 py-3 font-medium">Ürün payı</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const expanded = expandedRowKey === row.key;
              return (
                <Fragment key={row.key}>
                  <tr
                    className="cursor-pointer border-b border-border/70 last:border-0 hover:bg-muted/20"
                    onClick={() => onToggle(row.key)}
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-foreground">{row.displayName}</span>
                        {!row.unassigned && !row.active ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            Pasif
                          </span>
                        ) : null}
                        {row.unassigned ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            Atanmamış
                          </span>
                        ) : null}
                        {row.topProducts.length > 0 ? (
                          <Package className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{row.orderCount.toLocaleString("tr-TR")}</td>
                    <td className="px-4 py-3 text-foreground">{row.itemCount.toLocaleString("tr-TR")}</td>
                    <td className="px-4 py-3 text-foreground">{formatMenuPrice(row.revenue, currency)}</td>
                    <td className="px-4 py-3 text-foreground">{formatMenuPrice(row.tipAmount, currency)}</td>
                    <td className="px-4 py-3 text-foreground">
                      {formatMenuPrice(row.commissionAmount, currency)}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {row.billsClosedCount.toLocaleString("tr-TR")}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {formatMenuPrice(row.avgOrderValue, currency)}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      %{row.revenueSharePercent.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      %{row.itemSharePercent.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}
                    </td>
                  </tr>
                  {expanded && row.topProducts.length > 0 ? (
                    <tr className="border-b border-border/70 bg-muted/10">
                      <td colSpan={10} className="px-6 py-4">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">En çok sattığı ürünler</p>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {row.topProducts.map((product) => (
                            <div
                              key={product.key}
                              className="rounded-xl border border-border/50 bg-white px-2.5 py-1.5 shadow-sm/60 dark:bg-muted/60"
                            >
                              <p className="text-sm font-medium text-foreground">{product.name}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {product.quantity.toLocaleString("tr-TR")} adet ·{" "}
                                {formatMenuPrice(product.revenue, currency)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
