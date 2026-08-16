"use client";

import { motion } from "framer-motion";
import {
  Banknote,
  Receipt,
  UserCheck,
  UserX,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMenuPrice } from "@/components/menu-templates/types";
import type { MenuWaiterPerformanceReportResponse } from "@/lib/api";
import {
  buildWaiterPerformanceReportView,
  type WaiterPerformanceKpiId,
} from "@/reporting";

const c = (token: string) => `hsl(var(--chart-${token}))`;

const COLORS = {
  green: c("green"),
  indigo: c("indigo"),
  teal: c("teal"),
  orange: c("orange"),
};

const KPI_ICONS: Record<WaiterPerformanceKpiId, LucideIcon> = {
  activeWaiterCount: Users,
  assignedOrderCount: UserCheck,
  unassignedOrderCount: UserX,
  totalRevenue: Banknote,
};

const KPI_COLORS: Record<WaiterPerformanceKpiId, string> = {
  activeWaiterCount: COLORS.indigo,
  assignedOrderCount: COLORS.teal,
  unassignedOrderCount: COLORS.orange,
  totalRevenue: COLORS.green,
};

export default function AnalyticsWaiterPerformancePanel({
  report,
  tooltipStyle,
}: {
  report: MenuWaiterPerformanceReportResponse;
  tooltipStyle: Record<string, string>;
}) {
  const view = buildWaiterPerformanceReportView(report);
  const { currency, empty, rows, chartData } = view;
  const kpis = view.kpis.map((m) => ({
    ...m,
    icon: KPI_ICONS[m.id],
    color: KPI_COLORS[m.id],
    display: m.unit === "money" ? formatMenuPrice(m.value, currency) : m.display,
  }));

  if (empty) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Seçilen dönemde personel performans verisi yok. Garson kayıtları oluşturup siparişler onaylandıkça
        burada görünür.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {chartData.length > 0 ? (
        <div className="glow-card rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-sm font-medium text-foreground">Personel bazlı ciro</h2>
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
                    return [Number(value).toLocaleString("tr-TR"), "Sipariş"];
                  }}
                />
                <Bar dataKey="revenue" name="revenue" fill={COLORS.indigo} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      <div className="glow-card overflow-hidden rounded-lg border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-medium text-foreground">Personel performans tablosu</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Onaylanmış siparişler, garson atamasına göre gruplanır. Müşteri veya panel onayları
            &quot;Atanmamış&quot; satırında görünür.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-6 py-3 font-medium">Personel</th>
                <th className="px-4 py-3 font-medium">Sipariş</th>
                <th className="px-4 py-3 font-medium">Ciro</th>
                <th className="px-4 py-3 font-medium">Ort. sepet</th>
                <th className="px-4 py-3 font-medium">Ciro payı</th>
                <th className="px-4 py-3 font-medium">Sipariş payı</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-border/70 last:border-0">
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
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{row.orderCount.toLocaleString("tr-TR")}</td>
                  <td className="px-4 py-3 text-foreground">{formatMenuPrice(row.revenue, currency)}</td>
                  <td className="px-4 py-3 text-foreground">
                    {formatMenuPrice(row.avgOrderValue, currency)}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    %{row.revenueSharePercent.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    %{row.orderSharePercent.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
