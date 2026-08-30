"use client";

import Link from "next/link";
import {
  BellRing,
  BookOpen,
  Calculator,
  CalendarDays,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";

import { RequireScope } from "@/components/auth/RequireScope";
import { NavBadge } from "@/components/dashboard/NavBadge";
import type { ProductScope } from "@/lib/auth-user";
import { resolveDigitalMenuMenusHref } from "@/lib/dashboard-menu-context";
import {
  DASHBOARD_HUB_GRID,
  DASHBOARD_ICON_WELL,
  DASHBOARD_TILE,
  DASHBOARD_TILE_ROW,
  DASHBOARD_TYPE_KPI,
  DASHBOARD_TYPE_META,
} from "@/lib/dashboard-surface";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

export const SHORTCUT_CARD_CLASS = DASHBOARD_TILE_ROW;

type OverviewTile = {
  title: string;
  href: string | (() => string);
  icon: LucideIcon;
  requiredScope?: ProductScope;
  badgeKey?: "pendingOrders";
};

export const OPERATION_TILES: OverviewTile[] = [
  {
    title: "Sipariş Yönetimi",
    href: DASHBOARD_ROUTES.waiter,
    icon: BellRing,
    requiredScope: "WAITER_PANEL_OWNER",
    badgeKey: "pendingOrders",
  },
  {
    title: "Menülerim",
    href: () => resolveDigitalMenuMenusHref(),
    icon: BookOpen,
    requiredScope: "QR_MENU_OWNER",
  },
  {
    title: "Rezervasyonlar",
    href: DASHBOARD_ROUTES.reservations,
    icon: CalendarDays,
    requiredScope: "QR_MENU_OWNER",
  },
  {
    title: "Raporlar",
    href: DASHBOARD_ROUTES.reportsHub,
    icon: Sparkles,
    requiredScope: "SMART_REPORTING_OWNER",
  },
  {
    title: "Muhasebe",
    href: DASHBOARD_ROUTES.muhasebe,
    icon: Calculator,
  },
];

export const ACCOUNT_TILES: OverviewTile[] = [
  {
    title: "Hesabım",
    href: DASHBOARD_ROUTES.account,
    icon: User,
  },
];

function Tile({
  title,
  href,
  icon: Icon,
  badgeCount = 0,
}: OverviewTile & { badgeCount?: number }) {
  const resolvedHref = typeof href === "function" ? href() : href;

  return (
    <Link href={resolvedHref} className={SHORTCUT_CARD_CLASS}>
      <span className={`${DASHBOARD_ICON_WELL} h-9 w-9 text-sm`}>
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium tracking-tight text-foreground">{title}</span>
      <NavBadge count={badgeCount} className="ml-0" />
    </Link>
  );
}

export function OverviewShortcutGrid({
  tiles,
  pendingOrderCount,
}: {
  tiles: OverviewTile[];
  pendingOrderCount: number;
}) {
  return (
    <div className={DASHBOARD_HUB_GRID}>
      {tiles.map((tile) => (
        <RequireScope key={tile.title} scope={tile.requiredScope}>
          <Tile
            {...tile}
            badgeCount={tile.badgeKey === "pendingOrders" ? pendingOrderCount : 0}
          />
        </RequireScope>
      ))}
    </div>
  );
}

export function OverviewStatCard({
  href,
  label,
  value,
  hint,
  badgeCount = 0,
}: {
  href: string;
  label: string;
  value: number;
  hint: string;
  badgeCount?: number;
}) {
  return (
    <Link
      href={href}
      className={DASHBOARD_TILE}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={`${DASHBOARD_TYPE_META} font-semibold uppercase tracking-wider`}>{label}</p>
        <NavBadge count={badgeCount} className="ml-0" />
      </div>
      <p className={`mt-2 ${DASHBOARD_TYPE_KPI}`}>{value}</p>
      <p className={`mt-1 ${DASHBOARD_TYPE_META}`}>{hint}</p>
    </Link>
  );
}
