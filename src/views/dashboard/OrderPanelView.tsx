"use client";

import { useState } from "react";
import { BarChart3, Bell, Check, Copy, ExternalLink } from "lucide-react";

import { DashboardHubTile } from "@/components/dashboard/DashboardHubTile";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { DASHBOARD_HUB_GRID, DASHBOARD_SURFACE } from "@/lib/dashboard-surface";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

const HUB_ITEMS = [
  {
    key: "orders",
    title: "Sipariş Yönetimi",
    description: "Bekleyen siparişleri onayla veya reddet",
    icon: Bell,
    href: DASHBOARD_ROUTES.waiter,
  },
  {
    key: "reports",
    title: "Sipariş Raporları",
    description: "Personel performansı ve onaylanan siparişler",
    icon: BarChart3,
    href: DASHBOARD_ROUTES.orderPanelReports,
  },
] as const;

export default function OrderPanelView() {
  const { notify } = useDashboardBanners();
  const [linkCopied, setLinkCopied] = useState(false);

  const copyPanelLink = async () => {
    const absolute =
      typeof window !== "undefined"
        ? `${window.location.origin}${DASHBOARD_ROUTES.waiterPanel}`
        : DASHBOARD_ROUTES.waiterPanel;
    try {
      await navigator.clipboard.writeText(absolute);
      setLinkCopied(true);
      notify("info", "Garson paneli linki kopyalandı.");
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      notify("danger", "Link kopyalanamadı.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardPageHeader
        title="Garson Paneli"
        hint="Garsonların masa ve sipariş yönetimi için bağımsız uygulama"
      />

      <div className="flex items-center gap-2">
        <Button asChild className="h-11 min-w-0 flex-1 gap-2">
          <a href={DASHBOARD_ROUTES.waiterPanel} target="_blank" rel="noopener noreferrer">
            Garson paneline git
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        <button
          type="button"
          onClick={() => void copyPanelLink()}
          className={`${DASHBOARD_SURFACE} inline-flex h-11 w-11 shrink-0 items-center justify-center text-foreground transition-colors hover:bg-muted`}
          aria-label="Garson paneli linkini kopyala"
          title={linkCopied ? "Kopyalandı" : "Linki kopyala"}
        >
          {linkCopied ? (
            <Check className="h-4 w-4 text-emerald-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className={DASHBOARD_HUB_GRID}>
        {HUB_ITEMS.map((item) => (
          <DashboardHubTile
            key={item.key}
            title={item.title}
            description={item.description}
            icon={item.icon}
            href={item.href}
          />
        ))}
      </div>
    </div>
  );
}
