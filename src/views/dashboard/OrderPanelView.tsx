"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Bell, Check, ChevronRight, Copy, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  useWaiterPanelAccess,
  WaiterPanelGate,
} from "@/components/dashboard/waiter/WaiterPanelAccess";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

const HUB_ITEMS = [
  {
    key: "reports",
    title: "Sipariş Raporları",
    description: "Ciro, satış ve onaylanan siparişler",
    icon: BarChart3,
    href: DASHBOARD_ROUTES.orderPanelReports,
  },
  {
    key: "orders",
    title: "Siparişler",
    description: "Bekleyen siparişleri onayla veya reddet",
    icon: Bell,
    href: DASHBOARD_ROUTES.waiter,
  },
] as const;

export default function OrderPanelView() {
  const { notify } = useDashboardBanners();
  const { accessLoading, canUseWaiterPanel } = useWaiterPanelAccess();
  const [linkCopied, setLinkCopied] = useState(false);

  const copyPanelLink = async () => {
    const absolute =
      typeof window !== "undefined"
        ? `${window.location.origin}${DASHBOARD_ROUTES.waiterPanel}`
        : DASHBOARD_ROUTES.waiterPanel;
    try {
      await navigator.clipboard.writeText(absolute);
      setLinkCopied(true);
      notify("info", "Sipariş Paneli linki kopyalandı.");
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      notify("danger", "Link kopyalanamadı.");
    }
  };

  return (
    <WaiterPanelGate accessLoading={accessLoading} canUse={canUseWaiterPanel}>
    <div className="mx-auto w-full max-w-md space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sipariş Paneli</h1>
        <p className="text-sm text-muted-foreground">Garson sipariş uygulaması ve sipariş raporları</p>
      </div>

      <div className="flex items-center gap-2">
        <Button asChild className="h-11 min-w-0 flex-1 gap-2">
          <a href={DASHBOARD_ROUTES.waiterPanel} target="_blank" rel="noopener noreferrer">
            Sipariş paneline git
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        <button
          type="button"
          onClick={() => void copyPanelLink()}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-muted"
          aria-label="Sipariş Paneli linkini kopyala"
          title={linkCopied ? "Kopyalandı" : "Linki kopyala"}
        >
          {linkCopied ? (
            <Check className="h-4 w-4 text-emerald-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
        {HUB_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
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
        })}
      </div>
    </div>
    </WaiterPanelGate>
  );
}
