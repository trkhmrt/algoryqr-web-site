"use client";

import { Fragment, useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MenuWaiterPerformanceReportResponse } from "@/lib/api";
import {
  WAITER_FILTER_ALL,
  buildWaiterPerformanceReportView,
  filterWaiterPerformanceReportView,
  type WaiterPerformanceKpiId,
} from "@/reporting";

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
  billsClosedCount: Receipt,
};

const KPI_COLORS: Record<WaiterPerformanceKpiId, string> = {
  activeWaiterCount: COLORS.indigo,
  assignedOrderCount: COLORS.teal,
  unassignedOrderCount: COLORS.orange,
  totalRevenue: COLORS.green,
  soldItemCount: COLORS.violet,
  totalCommission: COLORS.orange,
  billsClosedCount: COLORS.indigo,
};

export default function AnalyticsWaiterPerformancePanel({
  report,
  tooltipStyle,
}: {
  report: MenuWaiterPerformanceReportResponse;
  tooltipStyle: Record<string, string>;
}) {
  const baseView = useMemo(() => buildWaiterPerformanceReportView(report), [report]);
  const [waiterFilter, setWaiterFilter] = useState(WAITER_FILTER_ALL);
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);

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

  if (baseView.empty) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Seçilen dönemde personel performans verisi yok. Garson kayıtları oluşturup siparişler onaylandıkça
        burada görünür.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Personel filtresi</p>
          <p className="text-xs text-muted-foreground">
            Tek personel seçince ciro, ürün ve komisyon metrikleri o kişiye göre daralır.
          </p>
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
            className="w-full sm:w-[240px] rounded-xl border border-border/50 bg-white px-2.5 py-1.5 shadow-sm transition-colors dark:border-border/60 dark:bg-muted/60"
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

      {empty ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Seçilen personel için bu dönemde veri yok.
        </div>
      ) : null}

      {!empty ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glow-card rounded-lg border bg-card text-card-foreground shadow-sm"
              >
                <div className="flex flex-col gap-3 p-5">
                  <div className="flex items-center gap-2">
                    <m.icon className="h-4 w-4 shrink-0" style={{ color: m.color }} />
                    <p className="text-sm font-semibold leading-tight text-foreground">{m.label}</p>
                  </div>
                  <p className="text-lg font-semibold tracking-tight text-foreground">{m.display}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {!isFiltered && daily.length > 0 ? (
            <div className="glow-card rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-sm font-medium text-foreground">Günlük personel cirosu</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily}>
                    <defs>
                      <linearGradient id="gradWaiterRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.indigo} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={COLORS.indigo} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
                    <XAxis dataKey="dateLabel" stroke="hsl(0 0% 40%)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="hsl(0 0% 40%)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
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
                    <Legend />
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
          ) : null}

          <div className={`grid gap-6 ${!isFiltered && hourly.length > 0 ? "lg:grid-cols-2" : ""}`}>
            {chartData.length > 0 ? (
              <div className="glow-card rounded-lg border bg-card p-6">
                <h2 className="mb-4 text-sm font-medium text-foreground">
                  {isFiltered ? "Seçilen personel cirosu" : "Personel bazlı ciro"}
                </h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
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
                        height={60}
                      />
                      <YAxis
                        stroke="hsl(0 0% 40%)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
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
            ) : null}

            {!isFiltered && hourly.length > 0 ? (
              <div className="glow-card rounded-lg border bg-card p-6">
                <h2 className="mb-4 text-sm font-medium text-foreground">Saatlik sipariş yoğunluğu</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
                      <XAxis dataKey="hour" stroke="hsl(0 0% 40%)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(0 0% 40%)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="orderCount" name="Sipariş" fill={COLORS.teal} radius={[4, 4, 0, 0]} opacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}
          </div>

          {products.length > 0 ? (
            <div className="glow-card rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-sm font-medium text-foreground">
                {isFiltered ? "En çok sattığı ürünler" : "Personel satışlarındaki en çok satılan ürünler"}
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...products].reverse()}
                    layout="vertical"
                    margin={{ left: 16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
                    <XAxis type="number" stroke="hsl(0 0% 40%)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
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
          ) : null}

          <div className="glow-card overflow-hidden rounded-lg border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-medium text-foreground">Personel performans tablosu</h2>
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
                          onClick={() => setExpandedRowKey(expanded ? null : row.key)}
                        >
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-medium text-foreground">{row.displayName}</span>
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
                              {row.topProducts.length > 0 ? (
                                <Package className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-foreground">{row.orderCount.toLocaleString("tr-TR")}</td>
                          <td className="px-4 py-3 text-foreground">{row.itemCount.toLocaleString("tr-TR")}</td>
                          <td className="px-4 py-3 text-foreground">{formatMenuPrice(row.revenue, currency)}</td>
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
                            <td colSpan={9} className="px-6 py-4">
                              <p className="mb-2 text-xs font-medium text-muted-foreground">En çok sattığı ürünler</p>
                              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {row.topProducts.map((product) => (
                                  <div
                                    key={product.key}
                                    className="rounded-xl border border-border/50 bg-white px-2.5 py-1.5 shadow-sm dark:border-border/60 dark:bg-muted/60"
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
        </>
      ) : null}
    </div>
  );
}
