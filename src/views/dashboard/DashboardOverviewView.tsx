"use client";

import { SetupChecklist } from "@/components/dashboard/SetupChecklist";
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
import { hasScope } from "@/lib/auth-user";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { buildSetupSteps, isSetupComplete } from "@/lib/dashboard-setup";

export default function DashboardOverviewView() {
  const { data: accessProfile } = useAccessProfile();
  const showOrders = hasScope(accessProfile, "WAITER_PANEL_OWNER");
  const showMenus = hasScope(accessProfile, "QR_MENU_OWNER");
  const cards = usePaymentMethods();
  const trial = useTrialStatus();
  const stats = useOverviewOpsStats({
    orders: showOrders,
    reservations: showMenus,
    menus: showMenus,
  });
  const steps = buildSetupSteps({
    hasCard: (cards.data?.length ?? 0) > 0,
    canOperate: trial.data?.status === "ACTIVE" || showMenus,
    branchCount: stats.branchCount,
    totalMenus: stats.totalMenus,
    liveMenus: stats.liveMenus,
  });
  const showChecklist =
    !stats.loading && !cards.isLoading && !trial.isLoading && !isSetupComplete(steps);
  const showStats = !stats.loading && (showOrders || (showMenus && stats.branchCount > 0));

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Genel Bakış
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Bugünün operasyonu ve sık kullanılan işlemler.
        </p>
      </header>

      {showChecklist ? (
        <div className="mb-8">
          <SetupChecklist steps={steps} />
        </div>
      ) : null}

      {showStats ? (
        <section className="mb-8 grid gap-3 sm:grid-cols-3" aria-label="Operasyon özeti">
          {showOrders ? (
            <OverviewStatCard
              href={DASHBOARD_ROUTES.waiter}
              label="Bekleyen sipariş"
              value={stats.pendingOrders}
              hint="Onay kuyruğu"
              badgeCount={stats.pendingOrders}
            />
          ) : null}
          {showMenus ? (
            <OverviewStatCard
              href={DASHBOARD_ROUTES.reservations}
              label="Bugünkü rezervasyon"
              value={stats.reservationsToday}
              hint="Seçili menü"
            />
          ) : null}
          {showMenus ? (
            <OverviewStatCard
              href={DASHBOARD_ROUTES.digitalMenuMenus}
              label="Yayındaki menü"
              value={stats.liveMenus}
              hint={stats.totalMenus > 0 ? `${stats.totalMenus} menü toplam` : "Henüz menü yok"}
            />
          ) : null}
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
