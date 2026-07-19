"use client";

import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  QrCode, Plus, TrendingUp, Eye, Clock, ArrowUpRight, ArrowDownRight, ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PackageUsageCard from "@/components/dashboard/PackageUsageCard";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { formatPackageDate, formatPackagePrice } from "@/lib/package-display";
import { usePackageUsage } from "@/hooks/use-package-usage";
import { useSubscription } from "@/hooks/use-subscription";

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
  const packageUsage = usePackageUsage();
  const subscription = useSubscription();
  const recentPurchases = (subscription.data?.purchases ?? []).slice(0, 5);

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

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <PackageUsageCard usage={packageUsage.data} isLoading={packageUsage.isLoading} />
        <Card className="glow-card">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">Paket geçmişi</p>
                <p className="text-xs text-muted-foreground">Son satın almalarınız</p>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
                <Link href={DASHBOARD_ROUTES.accountSubscription}>
                  Tümünü gör
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            {subscription.isLoading ? (
              <div className="h-20 animate-pulse rounded-md bg-muted" />
            ) : recentPurchases.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz satın alma kaydı yok.</p>
            ) : (
              <div className="space-y-2">
                {recentPurchases.map((purchase) => (
                  <Link
                    key={purchase.id}
                    href={DASHBOARD_ROUTES.accountPurchaseDetail(purchase.id)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2 transition-colors hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{purchase.packageName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPackageDate(purchase.purchasedAt)}
                        {purchase.paymentId ? ` · ${purchase.paymentId}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs font-medium text-foreground">
                      {formatPackagePrice(purchase.price ?? 0, purchase.currency)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="glow-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{metric.value}</p>
                </div>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className={`mt-3 flex items-center gap-1 text-xs ${metric.up ? "text-emerald-500" : "text-rose-500"}`}>
                {metric.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {metric.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glow-card">
        <CardContent className="p-5">
          <p className="mb-4 text-sm font-medium text-foreground">Trafik</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" />
                <Area type="monotone" dataKey="visitors" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted) / 0.4)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="glow-card">
        <CardContent className="p-5">
          <p className="mb-3 text-sm font-medium text-foreground">Son İçerikler</p>
          <div className="space-y-2">
            {recentContent.map((item) => (
              <div key={item.title} className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0">
                <div>
                  <p className="text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
                <span className="text-xs text-muted-foreground">{item.status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
