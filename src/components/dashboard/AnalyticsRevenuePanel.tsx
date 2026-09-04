"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMenuPrice } from "@/components/menu-templates/types";
import { SlidingTabSelect } from "@/components/ui/sliding-tab-select";
import { useIsMobile } from "@/hooks/use-mobile";
import type { MenuRevenuePersonnelRow, MenuRevenueReportResponse } from "@/lib/api";
import { buildRevenueReportView } from "@/reporting";
import { cn } from "@/lib/utils";

import {
  ArrowDown,
  Banknote,
  Trophy,
  buildBreakdownItems,
  KPI_COLORS,
  KPI_ICONS,
  REVENUE_COLORS,
  REVENUE_PIE_FILLS,
  RevenueRankedList,
  RevenueTable,
  SpotlightProductCard,
  UnsoldCard,
  type BreakdownItem,
  type KpiDisplay,
  type RevenueRow,
} from "./analyticsRevenueShared";

const MOBILE_SECTIONS = [
  { value: "ozet", label: "Özet" },
  { value: "trend", label: "Trend" },
  { value: "detay", label: "Detay" },
] as const;

type MobileSection = (typeof MOBILE_SECTIONS)[number]["value"];

const CHART_TABS = [
  { value: "daily", label: "Günlük" },
  { value: "hourly", label: "Saatlik" },
  { value: "category", label: "Kategori" },
  { value: "product", label: "Ürün" },
] as const;

type ChartTab = (typeof CHART_TABS)[number]["value"];

const DETAIL_TABS = [
  { value: "products", label: "Ürün ciro" },
  { value: "least", label: "En az" },
  { value: "categories", label: "Kategori" },
] as const;

type DetailTab = (typeof DETAIL_TABS)[number]["value"];

export default function AnalyticsRevenuePanel({
  report,
  tooltipStyle,
}: {
  report: MenuRevenueReportResponse;
  tooltipStyle: Record<string, string>;
}) {
  const isMobile = useIsMobile();
  const [section, setSection] = useState<MobileSection>("ozet");
  const [chartTab, setChartTab] = useState<ChartTab>("daily");
  const [detailTab, setDetailTab] = useState<DetailTab>("products");

  const view = buildRevenueReportView(report);
  const { currency, empty, daily, products, productsByQuantityAsc, categories, spotlight, hourly } = view;
  const breakdown = report.paymentBreakdown;
  const personnel = report.personnel ?? [];
  const breakdownCurrency = breakdown?.currency || currency;
  const breakdownItems = breakdown ? buildBreakdownItems(breakdown) : [];
  const kpis: KpiDisplay[] = view.kpis.map((m) => ({
    id: m.id,
    label: m.label,
    icon: KPI_ICONS[m.id],
    color: KPI_COLORS[m.id],
    display: m.unit === "money" ? formatMenuPrice(m.value, currency) : m.display,
  }));

  if (empty) {
    return (
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 text-sm text-muted-foreground shadow-none dark:border-border dark:bg-card">
        Seçilen dönemde tahsilat kaydı yok. Adisyon ödemeleri alındıkça ciro burada görünür.
      </div>
    );
  }

  const spotlightBlock = (
    <SpotlightGrid
      spotlight={spotlight}
      currency={currency}
      compact={isMobile}
    />
  );

  const overview = (
    <OverviewSection
      kpis={kpis}
      breakdownItems={breakdownItems}
      breakdownCurrency={breakdownCurrency}
      personnel={personnel}
      isMobile={isMobile}
      spotlight={spotlightBlock}
    />
  );

  const trends = (
    <TrendsSection
      daily={daily}
      hourly={hourly}
      categories={categories}
      products={products}
      currency={currency}
      tooltipStyle={tooltipStyle}
      isMobile={isMobile}
      chartTab={chartTab}
      onChartTabChange={setChartTab}
    />
  );

  const details = (
    <DetailsSection
      products={products}
      productsByQuantityAsc={productsByQuantityAsc}
      categories={categories}
      currency={currency}
      isMobile={isMobile}
      detailTab={detailTab}
      onDetailTabChange={setDetailTab}
    />
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
          ariaLabel="Ciro bölümleri"
        />
        {section === "ozet" ? overview : null}
        {section === "trend" ? trends : null}
        {section === "detay" ? details : null}
      </div>
    );
  }

  return (
    <>
      {overview}
      {trends}
      {details}
    </>
  );
}

function OverviewSection({
  kpis,
  breakdownItems,
  breakdownCurrency,
  personnel,
  isMobile,
  spotlight,
}: {
  kpis: KpiDisplay[];
  breakdownItems: BreakdownItem[];
  breakdownCurrency: string;
  personnel: MenuRevenuePersonnelRow[];
  isMobile: boolean;
  spotlight: ReactNode;
}) {
  const net = breakdownItems.find((item) => item.emphasize);

  return (
    <div className="space-y-4 md:space-y-6">
      {isMobile && net ? (
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 dark:border-border dark:bg-card">
          <p className="text-xs font-medium text-muted-foreground">{net.label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
            {formatMenuPrice(net.value, breakdownCurrency)}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card"
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

      {breakdownItems.length > 0 ? (
        isMobile ? (
          <div className="-mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {breakdownItems
              .filter((item) => !item.emphasize)
              .map((item) => (
                <div
                  key={item.label}
                  className="min-w-[8.5rem] snap-start rounded-2xl border border-[#e5e7eb] bg-white p-3 dark:border-border dark:bg-card"
                >
                  <div className="flex items-center gap-1.5">
                    <item.icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                    <p className="truncate text-[11px] font-medium text-muted-foreground">{item.label}</p>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold tabular-nums">
                    {formatMenuPrice(item.value, breakdownCurrency)}
                  </p>
                </div>
              ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
            {breakdownItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-none dark:border-border dark:bg-card"
              >
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" style={{ color: item.color }} />
                  <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                </div>
                <p className="mt-2 text-base font-semibold tabular-nums">
                  {formatMenuPrice(item.value, breakdownCurrency)}
                </p>
              </motion.div>
            ))}
          </div>
        )
      ) : null}

      {personnel.length > 0 ? (
        isMobile ? (
          <PersonnelMobileList rows={personnel} currency={breakdownCurrency} />
        ) : (
          <PersonnelDesktopTable rows={personnel} currency={breakdownCurrency} />
        )
      ) : null}

      {spotlight}
    </div>
  );
}

function SpotlightGrid({
  spotlight,
  currency,
  compact,
}: {
  spotlight: ReturnType<typeof buildRevenueReportView>["spotlight"];
  currency: string;
  compact: boolean;
}) {
  const cards = (
    <>
      <SpotlightProductCard
        card={spotlight.byQuantity}
        icon={Trophy}
        color={REVENUE_COLORS.violet}
        compact={compact}
        metric={
          spotlight.byQuantity.product
            ? `${spotlight.byQuantity.product.quantity.toLocaleString("tr-TR")} adet`
            : undefined
        }
      />
      <SpotlightProductCard
        card={spotlight.byRevenue}
        icon={Banknote}
        color={REVENUE_COLORS.green}
        compact={compact}
        metric={
          spotlight.byRevenue.product
            ? formatMenuPrice(spotlight.byRevenue.product.revenue, currency)
            : undefined
        }
      />
      <SpotlightProductCard
        card={spotlight.leastSold}
        icon={ArrowDown}
        color={REVENUE_COLORS.orange}
        compact={compact}
        metric={
          spotlight.leastSold.product
            ? `${spotlight.leastSold.product.quantity.toLocaleString("tr-TR")} adet`
            : undefined
        }
      />
      <UnsoldCard card={spotlight.unsold} compact={compact} />
    </>
  );

  if (compact) {
    return (
      <div className="-mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cards}
      </div>
    );
  }

  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards}</div>;
}

function PersonnelMobileList({ rows, currency }: { rows: MenuRevenuePersonnelRow[]; currency: string }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, 4);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white dark:border-border dark:bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Personel cirosu</h2>
      </div>
      <ul className="divide-y divide-border">
        {visible.map((row) => (
          <li key={row.waiterId ?? row.displayName} className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-medium text-foreground">
                {row.displayName}
                {row.active === false ? (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">(pasif)</span>
                ) : null}
              </p>
              <p className="shrink-0 text-sm font-semibold tabular-nums">
                {formatMenuPrice(Number(row.revenue ?? 0), currency)}
              </p>
            </div>
            <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
              Nakit {formatMenuPrice(Number(row.cashRevenue ?? 0), currency)} · Kart{" "}
              {formatMenuPrice(Number(row.cardRevenue ?? 0), currency)} · Bahşiş{" "}
              {formatMenuPrice(Number(row.tipRevenue ?? 0), currency)}
            </p>
          </li>
        ))}
      </ul>
      {rows.length > 4 ? (
        <button
          type="button"
          className="w-full border-t border-border py-2.5 text-center text-xs font-medium text-muted-foreground"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Daha az göster" : `Tümünü göster (${rows.length})`}
        </button>
      ) : null}
    </div>
  );
}

function PersonnelDesktopTable({ rows, currency }: { rows: MenuRevenuePersonnelRow[]; currency: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold text-foreground">Personel cirosu</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Personel</th>
              <th className="px-4 py-2 font-medium">Toplam</th>
              <th className="px-4 py-2 font-medium">Nakit</th>
              <th className="px-4 py-2 font-medium">Kart</th>
              <th className="px-4 py-2 font-medium">Bahşiş</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.waiterId ?? row.displayName} className="border-b border-border last:border-0">
                <td className="px-4 py-2 font-medium text-foreground">
                  {row.displayName}
                  {row.active === false ? (
                    <span className="ml-2 text-xs text-muted-foreground">(pasif)</span>
                  ) : null}
                </td>
                <td className="px-4 py-2 tabular-nums">{formatMenuPrice(Number(row.revenue ?? 0), currency)}</td>
                <td className="px-4 py-2 tabular-nums text-muted-foreground">
                  {formatMenuPrice(Number(row.cashRevenue ?? 0), currency)}
                </td>
                <td className="px-4 py-2 tabular-nums text-muted-foreground">
                  {formatMenuPrice(Number(row.cardRevenue ?? 0), currency)}
                </td>
                <td className="px-4 py-2 tabular-nums text-muted-foreground">
                  {formatMenuPrice(Number(row.tipRevenue ?? 0), currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrendsSection({
  daily,
  hourly,
  categories,
  products,
  currency,
  tooltipStyle,
  isMobile,
  chartTab,
  onChartTabChange,
}: {
  daily: { dateLabel: string; revenue: number; orderCount: number }[];
  hourly: { hour: string; revenue: number; orderCount: number }[];
  categories: RevenueRow[];
  products: RevenueRow[];
  currency: string;
  tooltipStyle: Record<string, string>;
  isMobile: boolean;
  chartTab: ChartTab;
  onChartTabChange: (tab: ChartTab) => void;
}) {
  const moneyTip = (value: unknown, name: unknown) =>
    name === "Ciro" ? formatMenuPrice(Number(value), currency) : Number(value).toLocaleString("tr-TR");

  const hourlyChart = (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-none dark:border-border dark:bg-card sm:p-6">
      {!isMobile ? <h2 className="mb-4 text-base font-semibold text-foreground">Saatlik yoğunluk</h2> : null}
      <div className={isMobile ? "h-56" : "h-64"}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourly}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
            <XAxis dataKey="hour" stroke="hsl(0 0% 40%)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(0 0% 40%)" fontSize={11} tickLine={false} axisLine={false} width={isMobile ? 32 : 40} />
            <Tooltip contentStyle={tooltipStyle} formatter={moneyTip} />
            {!isMobile ? <Legend /> : null}
            <Bar dataKey="orderCount" name="Sipariş" fill={REVENUE_COLORS.indigo} radius={[4, 4, 0, 0]} />
            <Bar dataKey="revenue" name="Ciro" fill={REVENUE_COLORS.teal} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const dailyChart = (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-none dark:border-border dark:bg-card sm:p-6">
      {!isMobile ? <h2 className="mb-4 text-base font-semibold text-foreground">Günlük ciro</h2> : null}
      <div className={isMobile ? "h-56" : "h-72"}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={daily}>
            <defs>
              <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={REVENUE_COLORS.green} stopOpacity={0.28} />
                <stop offset="100%" stopColor={REVENUE_COLORS.green} stopOpacity={0} />
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
              width={isMobile ? 32 : 40}
            />
            <Tooltip contentStyle={tooltipStyle} formatter={moneyTip} />
            {!isMobile ? <Legend /> : null}
            <Area
              type="monotone"
              dataKey="revenue"
              name="Ciro"
              stroke={REVENUE_COLORS.green}
              strokeWidth={2}
              fill="url(#gradRevenue)"
            />
            <Area
              type="monotone"
              dataKey="orderCount"
              name="Sipariş"
              stroke={REVENUE_COLORS.indigo}
              strokeWidth={1.5}
              fill="transparent"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const categoryChart = (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-none dark:border-border dark:bg-card sm:p-6">
      {!isMobile ? <h2 className="mb-4 text-base font-semibold text-foreground">Kategori cirosu</h2> : null}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categories}
              dataKey="revenue"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={isMobile ? 48 : 55}
              outerRadius={isMobile ? 72 : 80}
              paddingAngle={4}
            >
              {categories.map((row, i) => (
                <Cell key={row.key} fill={REVENUE_PIE_FILLS[i % REVENUE_PIE_FILLS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => formatMenuPrice(Number(value), currency)}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const productChart = (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-none dark:border-border dark:bg-card sm:p-6">
      {!isMobile ? <h2 className="mb-4 text-base font-semibold text-foreground">Ürün cirosu</h2> : null}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={products.slice(0, 8)} layout="vertical" margin={{ left: 4, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
            <XAxis type="number" stroke="hsl(0 0% 40%)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={isMobile ? 72 : 96}
              stroke="hsl(0 0% 40%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => formatMenuPrice(Number(value), currency)}
            />
            <Bar dataKey="revenue" name="Ciro" fill={REVENUE_COLORS.teal} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (isMobile) {
    const chartByTab: Record<ChartTab, ReactNode> = {
      daily: dailyChart,
      hourly: hourlyChart,
      category: categoryChart,
      product: productChart,
    };
    return (
      <div className="space-y-3">
        <SlidingTabSelect
          items={[...CHART_TABS]}
          value={chartTab}
          onValueChange={(v) => onChartTabChange(v as ChartTab)}
          variant="soft"
          size="sm"
          className="w-full justify-start overflow-x-auto"
          ariaLabel="Grafik seçimi"
        />
        {chartByTab[chartTab]}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hourlyChart}
      {dailyChart}
      <div className="grid gap-6 lg:grid-cols-2">
        {categoryChart}
        {productChart}
      </div>
    </div>
  );
}

function DetailsSection({
  products,
  productsByQuantityAsc,
  categories,
  currency,
  isMobile,
  detailTab,
  onDetailTabChange,
}: {
  products: RevenueRow[];
  productsByQuantityAsc: RevenueRow[];
  categories: RevenueRow[];
  currency: string;
  isMobile: boolean;
  detailTab: DetailTab;
  onDetailTabChange: (tab: DetailTab) => void;
}) {
  if (isMobile) {
    const listByTab: Record<DetailTab, ReactNode> = {
      products: (
        <RevenueRankedList title="Ürün bazlı satış" rows={products} currency={currency} limit={12} />
      ),
      least: (
        <RevenueRankedList
          title="En az satan ürünler"
          rows={productsByQuantityAsc}
          currency={currency}
          limit={12}
        />
      ),
      categories: (
        <RevenueRankedList title="Kategori bazlı satış" rows={categories} currency={currency} />
      ),
    };
    return (
      <div className="space-y-3">
        <SlidingTabSelect
          items={[...DETAIL_TABS]}
          value={detailTab}
          onValueChange={(v) => onDetailTabChange(v as DetailTab)}
          variant="soft"
          size="sm"
          className="w-full justify-start overflow-x-auto"
          ariaLabel="Detay listesi"
        />
        {listByTab[detailTab]}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueTable title="Ürün bazlı satış (ciro)" rows={products} currency={currency} />
        <RevenueTable title="En az satan ürünler (adet)" rows={productsByQuantityAsc} currency={currency} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueTable title="Kategori bazlı satış" rows={categories} currency={currency} />
      </div>
    </div>
  );
}
