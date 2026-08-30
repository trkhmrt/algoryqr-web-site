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
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

export const SHORTCUT_CARD_CLASS =
  "group flex items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-4 text-left shadow-none transition-colors hover:bg-muted/50 dark:border-border dark:bg-card";

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
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e5e7eb] bg-muted/30 text-muted-foreground dark:border-border">
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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
      className="rounded-2xl border border-[#e5e7eb] bg-white p-4 transition-colors hover:bg-muted/50 dark:border-border dark:bg-card"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <NavBadge count={badgeCount} className="ml-0" />
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Link>
  );
}
