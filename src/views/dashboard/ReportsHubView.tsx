"use client";

import Link from "next/link";
import { BarChart3, Bell, ChevronRight, Sparkles, TrendingUp } from "lucide-react";

import { RequireScope } from "@/components/auth/RequireScope";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

const HUB_ITEMS = [
  {
    key: "analytics",
    title: "Menü Analitiği",
    description: "Görüntülenme, sipariş ve gelir metrikleri",
    icon: TrendingUp,
    href: DASHBOARD_ROUTES.analytics,
  },
  {
    key: "smart-reports",
    title: "Akıllı Raporlar",
    description: "Yapay zeka destekli dönem raporları",
    icon: Sparkles,
    href: DASHBOARD_ROUTES.smartReports,
  },
  {
    key: "order-reports",
    title: "Sipariş Raporları",
    description: "Personel performansı ve onaylanan siparişler",
    icon: BarChart3,
    href: DASHBOARD_ROUTES.orderPanelReports,
    requiredScope: "WAITER_PANEL_OWNER" as const,
  },
] as const;

export default function ReportsHubView() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Raporlar</h1>
        <p className="text-sm text-muted-foreground">Menü, sipariş ve performans raporlarına erişin.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
        {HUB_ITEMS.map((item) => {
          const Icon = item.icon;
          const link = (
            <Link
              href={item.href}
              className="flex w-full items-center justify-between gap-3 bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                  <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          );

          if ("requiredScope" in item && item.requiredScope) {
            return (
              <RequireScope key={item.key} scope={item.requiredScope}>
                {link}
              </RequireScope>
            );
          }

          return <div key={item.key}>{link}</div>;
        })}
      </div>

      <RequireScope scope="WAITER_PANEL_OWNER">
        <Link
          href={DASHBOARD_ROUTES.waiter}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <Bell className="h-4 w-4 shrink-0" />
          Bekleyen siparişleri yönet
          <ChevronRight className="ml-auto h-4 w-4" />
        </Link>
      </RequireScope>
    </div>
  );
}
