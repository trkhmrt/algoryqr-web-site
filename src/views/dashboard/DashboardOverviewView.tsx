"use client";

import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  QrCode, Plus, TrendingUp, Eye, Clock, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

const metrics = [
  { label: "Toplam Tarama", value: "4,926", change: "+12.5%", up: true, icon: Eye },
  { label: "Aktif QR Kodlar", value: "3", change: "+1", up: true, icon: QrCode },
  { label: "Bu Hafta", value: "342", change: "+8.2%", up: true, icon: TrendingUp },
  { label: "Ort. Süre", value: "2d 34s", change: "-4.1%", up: false, icon: Clock },
];

const trafficData = [
  { name: "Pzt", views: 1200, visitors: 400 },
  { name: "Sal", views: 1900, visitors: 600 },
  { name: "Çar", views: 1600, visitors: 520 },
  { name: "Per", views: 2200, visitors: 780 },
  { name: "Cum", views: 2800, visitors: 920 },
  { name: "Cmt", views: 2100, visitors: 680 },
  { name: "Paz", views: 1800, visitors: 590 },
];

const recentContent = [
  { title: "Web Sitesi QR - algorycode.com", status: "Aktif", date: "5 Mar, 2026" },
  { title: "LinkedIn Profil QR", status: "Aktif", date: "4 Mar, 2026" },
  { title: "Menü QR Kodu", status: "Aktif", date: "3 Mar, 2026" },
  { title: "WiFi QR Kodu", status: "Pasif", date: "2 Mar, 2026" },
  { title: "Kampanya QR Kodu", status: "Aktif", date: "1 Mar, 2026" },
];

function useTooltipStyle() {
  return {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
    color: "hsl(var(--foreground))",
  };
}

export default function DashboardOverviewView() {
  const tooltipStyle = useTooltipStyle();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Genel Bakış</h1>
          <p className="text-sm text-muted-foreground">QR kodlarınızın özeti.</p>
        </div>
        <Button variant="hero" size="sm" className="gap-2" asChild>
          <Link href={DASHBOARD_ROUTES.qrCodesNew}>
            <Plus className="h-4 w-4" />
            Yeni QR Kod
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="glow-card transition-colors hover:bg-accent/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <m.icon className="h-4 w-4 text-muted-foreground" />
                <span className={`flex items-center gap-0.5 text-xs font-medium ${m.up ? "text-success" : "text-destructive"}`}>
                  {m.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {m.change}
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glow-card">
        <CardContent className="p-6">
          <h2 className="mb-4 text-sm font-medium text-foreground">Trafik</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="views" stroke="hsl(var(--foreground))" strokeWidth={1.5} fill="url(#viewsGrad)" />
                <Area type="monotone" dataKey="visitors" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="glow-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-medium text-foreground">Son İçerikler</h2>
        </div>
        <div className="divide-y divide-border">
          {recentContent.map((item) => (
            <div key={item.title} className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-accent/50">
              <span className="text-sm text-foreground">{item.title}</span>
              <div className="flex items-center gap-4">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${item.status === "Aktif" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                  {item.status}
                </span>
                <span className="text-xs text-muted-foreground">{item.date}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
