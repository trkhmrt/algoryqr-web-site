"use client";

import { BarChart3, Bell, Sparkles, TrendingUp, type LucideIcon } from "lucide-react";

import { RequireScope } from "@/components/auth/RequireScope";
import { DashboardHubTile } from "@/components/dashboard/DashboardHubTile";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import type { ProductScope } from "@/lib/auth-user";
import { DASHBOARD_HUB_GRID } from "@/lib/dashboard-surface";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

type HubItem = {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  requiredScope?: ProductScope;
};

const HUB_ITEMS: HubItem[] = [
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
    requiredScope: "WAITER_PANEL_OWNER",
  },
];

export default function ReportsHubView() {
  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardPageHeader
        title="Raporlar"
        hint="Menü, sipariş ve performans raporlarına erişin."
      />

      <div className={DASHBOARD_HUB_GRID}>
        {HUB_ITEMS.map((item) => {
          const tile = (
            <DashboardHubTile
              title={item.title}
              description={item.description}
              icon={item.icon}
              href={item.href}
            />
          );

          if (item.requiredScope) {
            return (
              <RequireScope key={item.key} scope={item.requiredScope}>
                {tile}
              </RequireScope>
            );
          }

          return <div key={item.key}>{tile}</div>;
        })}
        <RequireScope scope="WAITER_PANEL_OWNER">
          <DashboardHubTile
            title="Bekleyen siparişler"
            description="Onay kuyruğunu yönet"
            icon={Bell}
            href={DASHBOARD_ROUTES.waiter}
          />
        </RequireScope>
      </div>
    </div>
  );
}
