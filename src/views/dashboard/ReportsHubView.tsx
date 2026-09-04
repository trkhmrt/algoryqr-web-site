"use client";

import { Sparkles, TrendingUp, type LucideIcon } from "lucide-react";

import { DashboardHubTile } from "@/components/dashboard/DashboardHubTile";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DASHBOARD_HUB_GRID } from "@/lib/dashboard-surface";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

type HubItem = {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
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
];

export default function ReportsHubView() {
  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardPageHeader
        title="Raporlar"
        hint="Menü ve performans raporlarına erişin."
      />

      <div className={DASHBOARD_HUB_GRID}>
        {HUB_ITEMS.map((item) => (
          <div key={item.key}>
            <DashboardHubTile
              title={item.title}
              description={item.description}
              icon={item.icon}
              href={item.href}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
