"use client";

import { BellRing, CalendarDays, Store } from "lucide-react";

import { SetupChecklist } from "@/components/dashboard/SetupChecklist";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import {
  ACCOUNT_TILES,
  OPERATION_TILES,
  OverviewShortcutGrid,
  OverviewStatCard,
  SHORTCUT_CARD_CLASS,
} from "@/components/dashboard/overview-shortcuts";
import { ReportIssueCard } from "@/components/dashboard/ReportIssueCard";
import { useAccessProfile } from "@/hooks/use-access-profile";
import { usePaymentMethods, useTrialStatus } from "@/hooks/use-commerce";
import { useOverviewOpsStats } from "@/hooks/use-overview-ops-stats";
import { useSubscription } from "@/hooks/use-subscription";
import { hasScope } from "@/lib/auth-user";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { buildSetupSteps, isSetupComplete } from "@/lib/dashboard-setup";
import { isActivePaidPurchase } from "@/lib/product-access";

function pendingOrdersDetail(count: number): string {
  return count > 0 ? "Onay bekliyor" : "Kuyruk boş";
}

function reservationsDetail(menuName: string | null): string {
  return menuName ?? "Menü seçilmedi";
}

function liveMenusDetail(total: number): string {
  return total > 0 ? `${total} menü toplam` : "Menü yok";
}

export default function DashboardOverviewView() {
  const { data: accessProfile } = useAccessProfile();
  const showOrders = hasScope(accessProfile, "WAITER_PANEL_OWNER");
  const showMenus = hasScope(accessProfile, "QR_MENU_OWNER");
  const cards = usePaymentMethods();
  const trial = useTrialStatus();
  const subscription = useSubscription();
  const hasActiveSubscription = isActivePaidPurchase(subscription.data?.activePurchase ?? null);
  const stats = useOverviewOpsStats({
    orders: showOrders,
    reservations: showMenus,
    menus: showMenus,
  });
  const steps = buildSetupSteps({
    hasCard: (cards.data?.length ?? 0) > 0,
    canOperate: trial.data?.status === "ACTIVE" || showMenus || hasActiveSubscription,
    hasActiveSubscription,
    branchCount: stats.branchCount,
    totalMenus: stats.totalMenus,
    liveMenus: stats.liveMenus,
  });
  const showChecklist =
    !stats.loading &&
    !cards.isLoading &&
    !trial.isLoading &&
    !subscription.isLoading &&
    !isSetupComplete(steps);
  const showStats = !stats.loading && (showOrders || (showMenus && stats.branchCount > 0));

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <DashboardPageHeader
          title="Genel Bakış"
          hint="Bugünün operasyonu ve sık kullanılan işlemler."
        />
      </div>

      {showChecklist ? (
        <div className="mb-8">
          <SetupChecklist steps={steps} />
        </div>
      ) : null}

      {showStats ? (
        <section className="mb-8" aria-label="Bugünün özeti">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {showOrders ? (
              <OverviewStatCard
                href={DASHBOARD_ROUTES.waiter}
                icon={BellRing}
                label="Bekleyen sipariş"
                value={stats.pendingOrders}
                detail={pendingOrdersDetail(stats.pendingOrders)}
                accent="hsl(var(--chart-orange))"
              />
            ) : null}
            {showMenus ? (
              <OverviewStatCard
                href={DASHBOARD_ROUTES.reservations}
                icon={CalendarDays}
                label="Bugünkü rezervasyon"
                value={stats.reservationsToday}
                detail={reservationsDetail(stats.selectedMenuName)}
                accent="hsl(var(--chart-indigo))"
              />
            ) : null}
            {showMenus ? (
              <OverviewStatCard
                href={DASHBOARD_ROUTES.digitalMenuMenus}
                icon={Store}
                label="Yayındaki menü"
                value={stats.liveMenus}
                detail={liveMenusDetail(stats.totalMenus)}
                accent="hsl(var(--chart-teal))"
              />
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="space-y-8">
        <section aria-label="Operasyon">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Operasyon
          </h2>
          <OverviewShortcutGrid tiles={OPERATION_TILES} pendingOrderCount={stats.pendingOrders} />
        </section>
        <section aria-label="Hesap">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Hesap
          </h2>
          <OverviewShortcutGrid tiles={ACCOUNT_TILES} pendingOrderCount={0} />
        </section>
        <section aria-label="Destek">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            <ReportIssueCard className={SHORTCUT_CARD_CLASS} />
          </div>
        </section>
      </div>
    </div>
  );
}
