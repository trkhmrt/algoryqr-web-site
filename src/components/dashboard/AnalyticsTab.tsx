"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Eye,
  Users,
  ShoppingBag,
  Layers,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Treemap,
  Legend,
} from "recharts";

import {
  DigitalMenuPicker,
  useDigitalMenuOptions,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { useAccessProfile } from "@/hooks/use-access-profile";
import { useMenuAnalyticsReport } from "@/hooks/use-menu-analytics-report";
import { useSubscription } from "@/hooks/use-subscription";
import { hasProduct, hasScope } from "@/lib/auth-user";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { hasActiveProductAccess } from "@/lib/product-access";

const c = (token: string) => `hsl(var(--chart-${token}))`;

const COLORS = {
  green: c("green"),
  indigo: c("indigo"),
  teal: c("teal"),
  violet: c("violet"),
  red: c("red"),
  orange: c("orange"),
  stone: c("stone"),
};

const DEVICE_FILLS = [COLORS.indigo, COLORS.orange, COLORS.teal];

function useTooltipStyle() {
  if (typeof document === "undefined") {
    return {
      backgroundColor: "hsl(0 0% 100%)",
      border: "1px solid hsl(0 0% 88%)",
      borderRadius: "8px",
      fontSize: "12px",
      color: "hsl(0 0% 10%)",
    };
  }
  const isDark = document.documentElement.classList.contains("dark");
  return {
    backgroundColor: isDark ? "hsl(0 0% 8%)" : "hsl(0 0% 100%)",
    border: isDark ? "1px solid hsl(0 0% 15%)" : "1px solid hsl(0 0% 88%)",
    borderRadius: "8px",
    fontSize: "12px",
    color: isDark ? "hsl(0 0% 93%)" : "hsl(0 0% 10%)",
    boxShadow: isDark ? "none" : "0 2px 8px hsl(0 0% 0% / 0.08)",
  };
}

const gridStroke = "hsl(0 0% 15%)";
const axisStroke = "hsl(0 0% 40%)";

function periodRange(period: "7d" | "30d" | "90d") {
  const to = new Date();
  const from = new Date();
  const days = period === "7d" ? 6 : period === "30d" ? 29 : 89;
  from.setDate(to.getDate() - days);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

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

function useAnalyticsAccess() {
  const { data: accessProfile, isLoading: accessLoading } = useAccessProfile();
  const subscription = useSubscription();
  const entitlements = Array.isArray(subscription.data?.entitlements)
    ? subscription.data.entitlements
    : [];
  const purchases = Array.isArray(subscription.data?.purchases) ? subscription.data.purchases : [];
  const canUse =
    hasActiveProductAccess(entitlements, purchases, "QR_ANALYTICS") ||
    hasScope(accessProfile, "QR_ANALYTICS_OWNER") ||
    hasProduct(accessProfile, "QR_ANALYTICS");
  return {
    accessLoading: accessLoading || subscription.isLoading,
    canUse,
  };
}

export default function AnalyticsTab() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const tooltipStyle = useTooltipStyle();
  const { accessLoading, canUse } = useAnalyticsAccess();
  const { menuQrs, loading: menusLoading } = useDigitalMenuOptions();
  const { selection, selectQrId, loading: selectionLoading } = useDigitalMenuSelection();
  const range = useMemo(() => periodRange(period), [period]);
  const menuId = selection?.menu.menuId ?? null;
  const reportQuery = useMenuAnalyticsReport(menuId, range.from, range.to, canUse && menuId != null);
  const report = reportQuery.data;

  if (accessLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!canUse) {
    return (
      <div className="space-y-3 animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Analitik</h1>
        <p className="text-sm text-muted-foreground">
          Menü ziyaret raporları için Detaylı Raporlama (QR_ANALYTICS) paketi gerekir.
        </p>
        <Link
          href={DASHBOARD_ROUTES.accountSubscription}
          className="inline-flex text-sm font-medium text-foreground underline-offset-2 hover:underline"
        >
          Paketleri incele
        </Link>
      </div>
    );
  }

  const daily = (report?.daily ?? []).map((row) => ({
    ...row,
    dateLabel: formatShortDate(row.date),
  }));
  const hourly = (report?.hourly ?? []).map((row) => ({
    hour: String(row.hour).padStart(2, "0"),
    views: row.views,
  }));
  const deviceTotal = (report?.devices ?? []).reduce((sum, d) => sum + d.value, 0);
  const devices = (report?.devices ?? []).map((d, i) => ({
    ...d,
    fill: DEVICE_FILLS[i % DEVICE_FILLS.length],
    pct: deviceTotal > 0 ? Math.round((d.value / deviceTotal) * 100) : 0,
  }));
  const funnel = [
    { name: "Menü", value: report?.funnel.menuOpens ?? 0 },
    { name: "Kategori", value: report?.funnel.categoryViews ?? 0 },
    { name: "Ürün", value: report?.funnel.productViews ?? 0 },
  ];
  const treeData = (report?.categoryProductTree ?? []).map((node) => ({
    name: node.name,
    size: node.size,
    children: (node.children ?? []).map((child) => ({
      name: child.name,
      size: child.size,
    })),
  }));
  const kpis = [
    {
      label: "Oturum",
      value: report?.kpis.sessions ?? 0,
      icon: Users,
      color: COLORS.indigo,
    },
    {
      label: "Menü açılışı",
      value: report?.kpis.menuOpens ?? 0,
      icon: Eye,
      color: COLORS.teal,
    },
    {
      label: "Ürün görüntüleme",
      value: report?.kpis.productViews ?? 0,
      icon: ShoppingBag,
      color: COLORS.green,
    },
    {
      label: "Ort. ürün / oturum",
      value: (report?.kpis.avgProductsPerSession ?? 0).toFixed(1),
      icon: Layers,
      color: COLORS.orange,
    },
  ];
  const loading = menusLoading || selectionLoading || reportQuery.isLoading;
  const empty = !loading && (report?.kpis.sessions ?? 0) === 0 && (report?.kpis.menuOpens ?? 0) === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Analitik</h1>
          <p className="text-sm text-muted-foreground">Menü QR ziyaret ve yolculuk raporları.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <DigitalMenuPicker
            menuQrs={menuQrs}
            selectedQrId={selection?.qr.id ?? null}
            onSelectQrId={selectQrId}
            disabled={menusLoading}
          />
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            {(["7d", "30d", "90d"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  period === p
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "7d" ? "7 Gün" : p === "30d" ? "30 Gün" : "90 Gün"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {menuQrs.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Analitik için önce bir menü QR oluşturun.{" "}
          <Link
            href={DASHBOARD_ROUTES.digitalMenuCreate}
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            Menü oluştur
          </Link>
        </div>
      ) : null}

      {menuId != null && loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : null}

      {menuId != null && reportQuery.isError ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Rapor yüklenemedi. Yetkinizi ve menü sahipliğini kontrol edin.
        </div>
      ) : null}

      {menuId != null && !loading && !reportQuery.isError ? (
        <>
          {empty ? (
            <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
              Seçilen dönemde henüz ziyaret verisi yok. Public menü taramaları burada görünecek.
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glow-card rounded-lg border bg-card text-card-foreground shadow-sm"
              >
                <div className="p-5">
                  <m.icon className="h-4 w-4" style={{ color: m.color }} />
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                    {typeof m.value === "number" ? m.value.toLocaleString("tr-TR") : m.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="glow-card rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-sm font-medium text-foreground">Günlük oturum & görüntüleme</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily}>
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
                  <XAxis dataKey="dateLabel" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Area type="monotone" dataKey="sessions" name="Oturum" stroke={COLORS.indigo} strokeWidth={2} fill="url(#gradSessions)" />
                  <Area type="monotone" dataKey="menuOpens" name="Menü açılışı" stroke={COLORS.teal} strokeWidth={2} fill="url(#gradOpens)" />
                  <Area type="monotone" dataKey="productViews" name="Ürün" stroke={COLORS.green} strokeWidth={1.5} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glow-card rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-sm font-medium text-foreground">Saatlik yoğunluk</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourly}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="hour" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="views" name="Görüntüleme" fill={COLORS.green} radius={[4, 4, 0, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glow-card rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-sm font-medium text-foreground">Cihaz dağılımı</h2>
              <div className="h-56 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={devices} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      {devices.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.fill} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 min-w-[120px]">
                  {devices.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className="text-xs text-muted-foreground">{d.name}</span>
                      <span className="text-xs font-medium text-foreground ml-auto">{d.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glow-card rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-sm font-medium text-foreground">En çok görüntülenen ürünler</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...(report?.topProducts ?? [])].reverse()}
                    layout="vertical"
                    margin={{ left: 16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis type="number" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
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

            <div className="glow-card rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-sm font-medium text-foreground">En çok görüntülenen kategoriler</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report?.topCategories ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="views" name="Görüntüleme" fill={COLORS.violet} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glow-card rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-sm font-medium text-foreground">Kategori → ürün yoğunluk</h2>
              <div className="h-64">
                {treeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                      data={treeData}
                      dataKey="size"
                      nameKey="name"
                      stroke="hsl(var(--background))"
                      content={<TreemapContent />}
                    />
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground py-12 text-center">Veri yok</p>
                )}
              </div>
            </div>

            <div className="glow-card rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-sm font-medium text-foreground">Funnel: menü → kategori → ürün</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={funnel}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" name="Adım" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glow-card rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-sm font-medium text-foreground">Örnek oturum yolculukları</h2>
            {(report?.sampleJourneys ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz yolculuk örneği yok.</p>
            ) : (
              <div className="space-y-4">
                {(report?.sampleJourneys ?? []).map((journey) => (
                  <div key={journey.sessionId} className="rounded-lg border border-border p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{journey.sessionId.slice(0, 8)}</span>
                      <span>
                        {new Date(journey.startedAt).toLocaleString("tr-TR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {journey.steps.map((step, idx) => (
                        <span
                          key={`${journey.sessionId}-${idx}`}
                          className="rounded-md border border-border bg-accent/40 px-2 py-1 text-xs text-foreground"
                        >
                          {step.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
