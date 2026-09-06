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
  DASHBOARD_TILE_ROW,
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
  icon: Icon,
  label,
  value,
  detail,
  accent,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  value: number;
  detail?: string;
  accent?: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[#e5e7eb] bg-white text-card-foreground shadow-none transition-colors hover:bg-muted/40 dark:border-border dark:bg-card"
    >
      <div className="flex flex-col gap-1.5 p-3.5 sm:gap-3 sm:p-5">
        <div className="flex items-center gap-2">
          <Icon
            className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
            style={accent ? { color: accent } : undefined}
            aria-hidden
          />
          <p className="text-xs font-semibold leading-tight text-muted-foreground sm:text-sm sm:text-foreground">
            {label}
          </p>
        </div>
        <p className="text-base font-semibold tracking-tight tabular-nums text-foreground sm:text-lg">
          {value.toLocaleString("tr-TR")}
        </p>
        {detail ? <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{detail}</p> : null}
      </div>
    </Link>
  );
}
