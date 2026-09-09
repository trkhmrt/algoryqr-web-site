"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
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
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import type { RevenueChannelDailyPoint, RevenueChannelShare } from "@/lib/api";
import { cn } from "@/lib/utils";

import { REVENUE_COLORS, REVENUE_PIE_FILLS } from "./analyticsRevenueShared";

const CHANNEL_COLORS: Record<string, string> = {
  IN_HOUSE: REVENUE_COLORS.green,
  UBER_EATS: REVENUE_COLORS.indigo,
};

function n(value: number | string | null | undefined): number {
  return Number(value ?? 0);
}

export default function AnalyticsChannelPanel({
  channels,
  channelDaily,
  currency,
  tooltipStyle,
  accountScopedNote,
}: {
  channels: RevenueChannelShare[];
  channelDaily: RevenueChannelDailyPoint[];
  currency: string;
  tooltipStyle: Record<string, string>;
  accountScopedNote?: boolean;
}) {
  const rows = useMemo(
    () =>
      [...channels].sort((a, b) => n(b.revenue) - n(a.revenue)),
    [channels],
  );
  const connectedWithData = rows.filter((c) => c.connected || n(c.revenue) > 0);
  const leader = connectedWithData[0] ?? null;
  const uber = rows.find((c) => c.code === "UBER_EATS");
  const inHouse = rows.find((c) => c.code === "IN_HOUSE");
  const aovDelta =
    inHouse && uber && n(inHouse.avgOrderValue) > 0
      ? n(uber.avgOrderValue) - n(inHouse.avgOrderValue)
      : null;

  const donutData = rows
    .filter((c) => c.connected || n(c.revenue) > 0)
    .map((c) => ({
      name: c.label,
      code: c.code,
      value: n(c.revenue),
      share: n(c.sharePercent),
    }));

  const compareData = rows.map((c) => ({
    name: c.label,
    code: c.code,
    revenue: n(c.revenue),
    orders: c.orderCount ?? 0,
    aov: n(c.avgOrderValue),
    connected: c.connected,
  }));

  const dailyStacked = useMemo(() => {
    const byDate = new Map<string, Record<string, number | string>>();
    for (const point of channelDaily) {
      const key = point.date;
      const row = byDate.get(key) ?? { date: key };
      row[point.channelCode] = n(point.revenue);
      byDate.set(key, row);
    }
    return [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [channelDaily]);

  const channelCodes = [...new Set(channelDaily.map((p) => p.channelCode))];

  if (rows.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
      aria-label="Satış kanalları"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-foreground">Satış kanalları</h3>
          <p className="text-sm text-muted-foreground">
            Masa/QR ve entegrasyon cirolarının karşılaştırması
          </p>
        </div>
        {accountScopedNote && uber?.connected ? (
          <p className="text-xs text-muted-foreground">
            Uber Eats hesabı genelindeki ciroyu içerir
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiTile
          label="Lider kanal"
          value={leader ? leader.label : "—"}
          hint={leader ? `%${n(leader.sharePercent).toFixed(0)} pay` : undefined}
        />
        <KpiTile
          label="Uber Eats payı"
          value={
            uber?.connected
              ? `%${n(uber.sharePercent).toFixed(0)}`
              : "Bağlı değil"
          }
          hint={
            uber?.connected
              ? formatMenuPrice(n(uber.revenue), currency)
              : undefined
          }
        />
        <KpiTile
          label="Ort. sepet farkı"
          value={
            aovDelta == null
              ? "—"
              : `${aovDelta >= 0 ? "+" : ""}${formatMenuPrice(aovDelta, currency)}`
          }
          hint="Uber Eats − Masa/QR"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 dark:border-border dark:bg-card">
          <p className="mb-3 text-sm font-medium text-foreground">Ciro payı</p>
          {donutData.every((d) => d.value <= 0) ? (
            <EmptyChart text="Bu dönemde kanal cirosu yok." />
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="h-48 w-full max-w-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {donutData.map((entry, index) => (
                        <Cell
                          key={entry.code}
                          fill={CHANNEL_COLORS[entry.code] ?? REVENUE_PIE_FILLS[index % REVENUE_PIE_FILLS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => formatMenuPrice(Number(value ?? 0), currency)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="w-full space-y-2 text-sm">
                {donutData.map((entry) => (
                  <li key={entry.code} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          background:
                            CHANNEL_COLORS[entry.code] ?? REVENUE_COLORS.teal,
                        }}
                      />
                      {entry.name}
                    </span>
                    <span className="tabular-nums text-foreground">
                      {formatMenuPrice(entry.value, currency)}
                      <span className="ml-2 text-xs text-muted-foreground">
                        %{entry.share.toFixed(0)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 dark:border-border dark:bg-card">
          <p className="mb-3 text-sm font-medium text-foreground">Kanal kıyası</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={88}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => {
                    if (name === "revenue" || name === "aov") {
                      return formatMenuPrice(Number(value ?? 0), currency);
                    }
                    return String(value ?? 0);
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Ciro" fill={REVENUE_COLORS.green} radius={[0, 4, 4, 0]} />
                <Bar dataKey="orders" name="Sipariş" fill={REVENUE_COLORS.indigo} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {!uber?.connected ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Uber Eats bağlı değil.{" "}
              <Link href={DASHBOARD_ROUTES.uberEats} className="text-primary underline-offset-2 hover:underline">
                Entegrasyonu bağla
              </Link>
            </p>
          ) : null}
        </div>
      </div>

      {dailyStacked.length > 1 ? (
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 dark:border-border dark:bg-card">
          <p className="mb-3 text-sm font-medium text-foreground">Dönem içi seyir</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyStacked}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={48} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => formatMenuPrice(Number(value ?? 0), currency)}
                />
                <Legend />
                {channelCodes.map((code) => (
                  <Area
                    key={code}
                    type="monotone"
                    dataKey={code}
                    name={rows.find((r) => r.code === code)?.label ?? code}
                    stackId="1"
                    stroke={CHANNEL_COLORS[code] ?? REVENUE_COLORS.teal}
                    fill={CHANNEL_COLORS[code] ?? REVENUE_COLORS.teal}
                    fillOpacity={0.45}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </motion.section>
  );
}

function KpiTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 dark:border-border dark:bg-card">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-lg font-semibold tracking-tight text-foreground")}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
