import { useState } from "react";
import { motion } from "framer-motion";
import {
  Eye, Users, TrendingUp, Clock, ArrowUpRight, ArrowDownRight,
  Globe, MousePointerClick, Zap, Target,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ComposedChart, Scatter, Legend,
  RadialBarChart, RadialBar, Treemap,
} from "recharts";

/* ─── CSS variable reader ─── */
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

/* ─── Data ─── */
const dailyData = [
  { date: "28 Şub", views: 3200, unique: 1800, bounced: 420 },
  { date: "1 Mar", views: 4100, unique: 2200, bounced: 380 },
  { date: "2 Mar", views: 3800, unique: 2050, bounced: 510 },
  { date: "3 Mar", views: 5200, unique: 2900, bounced: 340 },
  { date: "4 Mar", views: 4800, unique: 2700, bounced: 290 },
  { date: "5 Mar", views: 6100, unique: 3400, bounced: 420 },
  { date: "6 Mar", views: 5500, unique: 3100, bounced: 360 },
];

const hourlyData = [
  { hour: "00", scans: 45 }, { hour: "02", scans: 22 }, { hour: "04", scans: 15 },
  { hour: "06", scans: 38 }, { hour: "08", scans: 120 }, { hour: "10", scans: 280 },
  { hour: "12", scans: 340 }, { hour: "14", scans: 310 }, { hour: "16", scans: 250 },
  { hour: "18", scans: 180 }, { hour: "20", scans: 130 }, { hour: "22", scans: 75 },
];

const deviceData = [
  { name: "Mobil", value: 62, fill: COLORS.indigo },
  { name: "Masaüstü", value: 28, fill: COLORS.teal },
  { name: "Tablet", value: 10, fill: COLORS.orange },
];

const countryData = [
  { country: "Türkiye", scans: 3842, pct: 58 },
  { country: "Almanya", scans: 892, pct: 13 },
  { country: "ABD", scans: 645, pct: 10 },
  { country: "İngiltere", scans: 423, pct: 6 },
  { country: "Fransa", scans: 312, pct: 5 },
  { country: "Diğer", scans: 512, pct: 8 },
];

const topPages = [
  { page: "/qr/website", views: 4201 },
  { page: "/qr/linkedin", views: 3892 },
  { page: "/qr/menu", views: 2456 },
  { page: "/qr/wifi", views: 1893 },
  { page: "/qr/kampanya", views: 1254 },
];

const sources = [
  { name: "Direkt", value: 42, fill: COLORS.indigo },
  { name: "Google", value: 28, fill: COLORS.green },
  { name: "Twitter", value: 15, fill: COLORS.violet },
  { name: "GitHub", value: 10, fill: COLORS.teal },
  { name: "Diğer", value: 5, fill: COLORS.orange },
];

const conversionData = [
  { name: "Pzt", rate: 4.2 }, { name: "Sal", rate: 5.1 }, { name: "Çar", rate: 3.8 },
  { name: "Per", rate: 6.3 }, { name: "Cum", rate: 7.1 }, { name: "Cmt", rate: 5.5 },
  { name: "Paz", rate: 4.8 },
];

const radarData = [
  { metric: "Hız", A: 85, B: 70 },
  { metric: "Güvenilirlik", A: 92, B: 80 },
  { metric: "Erişim", A: 78, B: 85 },
  { metric: "Etkileşim", A: 88, B: 65 },
  { metric: "Dönüşüm", A: 72, B: 90 },
  { metric: "Memnuniyet", A: 95, B: 75 },
];

const channelPerformance = [
  { channel: "E-posta", clicks: 1240, conversions: 320, revenue: 4800 },
  { channel: "Sosyal", clicks: 2100, conversions: 180, revenue: 2700 },
  { channel: "Organik", clicks: 3400, conversions: 520, revenue: 7800 },
  { channel: "Reklam", clicks: 1800, conversions: 410, revenue: 6150 },
  { channel: "Referans", clicks: 900, conversions: 150, revenue: 2250 },
];

const radialData = [
  { name: "Hedef", value: 78, fill: COLORS.green },
  { name: "Gerçekleşen", value: 62, fill: COLORS.indigo },
];

const metricCards = [
  { label: "Toplam Görüntüleme", value: "32,700", change: "+18.3%", up: true, icon: Eye, color: COLORS.indigo },
  { label: "Tekil Ziyaretçi", value: "18,150", change: "+14.7%", up: true, icon: Users, color: COLORS.teal },
  { label: "Tıklama Oranı", value: "%67.4", change: "+3.2%", up: true, icon: MousePointerClick, color: COLORS.green },
  { label: "Ort. Oturum", value: "2d 48s", change: "-2.1%", up: false, icon: Clock, color: COLORS.orange },
];

/* ─── Tooltip hook ─── */
function useTooltipStyle() {
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

export default function AnalyticsTab() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");
  const tooltipStyle = useTooltipStyle();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Analitik</h1>
          <p className="text-sm text-muted-foreground">Detaylı performans raporları.</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "7d" ? "7 Gün" : p === "30d" ? "30 Gün" : "90 Gün"}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glow-card rounded-lg border bg-card text-card-foreground shadow-sm transition-colors hover:bg-accent/30"
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <m.icon className="h-4 w-4" style={{ color: m.color }} />
                <span className={`flex items-center gap-0.5 text-xs font-medium ${m.up ? "text-chart-green" : "text-chart-red"}`}>
                  {m.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {m.change}
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Area Chart */}
      <div className="glow-card rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h2 className="mb-4 text-sm font-medium text-foreground">Sayfa Görüntüleme & Tekil Ziyaretçi</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="gradIndigo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.indigo} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={COLORS.indigo} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradTeal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.teal} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={COLORS.teal} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="views" stroke={COLORS.indigo} strokeWidth={2} fill="url(#gradIndigo)" />
              <Area type="monotone" dataKey="unique" stroke={COLORS.teal} strokeWidth={2} fill="url(#gradTeal)" />
              <Area type="monotone" dataKey="bounced" stroke={COLORS.red} strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-column: Hourly + Device */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glow-card rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="mb-4 text-sm font-medium text-foreground">Saatlik Tarama Dağılımı</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="hour" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="scans" fill={COLORS.green} radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glow-card rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="mb-4 text-sm font-medium text-foreground">Cihaz Dağılımı</h2>
          <div className="h-56 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deviceData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 min-w-[120px]">
              {deviceData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                  <span className="text-xs text-muted-foreground">{d.name}</span>
                  <span className="text-xs font-medium text-foreground ml-auto">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Radar + Radial Bar */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glow-card rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="mb-4 text-sm font-medium text-foreground">Performans Karşılaştırma</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke={gridStroke} />
                <PolarAngleAxis dataKey="metric" stroke={axisStroke} fontSize={11} />
                <PolarRadiusAxis stroke={gridStroke} fontSize={10} />
                <Radar name="Bu Hafta" dataKey="A" stroke={COLORS.violet} fill={COLORS.violet} fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Geçen Hafta" dataKey="B" stroke={COLORS.orange} fill={COLORS.orange} fillOpacity={0.15} strokeWidth={2} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: "12px", color: axisStroke }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glow-card rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="mb-4 text-sm font-medium text-foreground">Hedef Gerçekleşme</h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={radialData} startAngle={180} endAngle={0}>
                <RadialBar dataKey="value" cornerRadius={8} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Channel Performance — Composed Chart */}
      <div className="glow-card rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h2 className="mb-4 text-sm font-medium text-foreground">Kanal Performansı</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={channelPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="channel" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar yAxisId="left" dataKey="clicks" fill={COLORS.indigo} radius={[4, 4, 0, 0]} opacity={0.8} name="Tıklama" />
              <Bar yAxisId="left" dataKey="conversions" fill={COLORS.green} radius={[4, 4, 0, 0]} opacity={0.8} name="Dönüşüm" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke={COLORS.orange} strokeWidth={2} dot={{ fill: COLORS.orange, r: 3 }} name="Gelir" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversion Rate */}
      <div className="glow-card rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h2 className="mb-4 text-sm font-medium text-foreground">Dönüşüm Oranı (%)</h2>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="name" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke={COLORS.violet}
                strokeWidth={2}
                dot={{ fill: COLORS.violet, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: COLORS.violet }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Traffic Sources Donut + Top QR Codes */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glow-card rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="mb-4 text-sm font-medium text-foreground">Trafik Kaynakları</h2>
          <div className="h-56 flex items-center">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie data={sources} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {sources.map((entry, index) => (
                    <Cell key={`src-${index}`} fill={entry.fill} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5 flex-1">
              {sources.map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                  <span className="text-xs text-muted-foreground flex-1">{s.name}</span>
                  <span className="text-xs font-medium text-foreground">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glow-card rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="mb-4 text-sm font-medium text-foreground">En Çok Taranan QR Kodlar</h2>
          <div className="space-y-3">
            {topPages.map((p, i) => {
              const barColors = [COLORS.indigo, COLORS.teal, COLORS.green, COLORS.violet, COLORS.orange];
              const maxViews = topPages[0].views;
              return (
                <div key={p.page} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-mono text-sm text-foreground">{p.page}</span>
                    <span className="ml-4 font-mono text-sm text-muted-foreground">{p.views.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-accent">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${(p.views / maxViews) * 100}%`,
                        backgroundColor: barColors[i % barColors.length],
                        opacity: 0.7,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Country breakdown */}
      <div className="glow-card rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h2 className="mb-4 text-sm font-medium text-foreground">Ülke Dağılımı</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {countryData.map((co, i) => {
            const flagColors = [COLORS.red, COLORS.indigo, COLORS.teal, COLORS.violet, COLORS.orange, COLORS.stone];
            return (
              <div key={co.country} className="flex items-center gap-3">
                <Globe className="h-3 w-3" style={{ color: flagColors[i % flagColors.length] }} />
                <span className="text-sm text-foreground flex-1">{co.country}</span>
                <span className="text-xs text-muted-foreground">{co.scans.toLocaleString()}</span>
                <span className="text-xs font-medium text-foreground w-8 text-right">{co.pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
