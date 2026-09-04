"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { BrandLogo } from "@/components/BrandLogo";
import {
  QrCode,
  LogOut,
  BarChart3,
  User,
  Users,
  UsersRound,
  Info,
  AlertTriangle,
  XCircle,
  X,
  MonitorSmartphone,
  PanelLeft,
  PanelLeftClose,
  TrendingUp,
  Calculator,
  Megaphone,
  Search,
  UtensilsCrossed,
  CalendarDays,
} from "lucide-react";

import { DigitalMenuIcon } from "@/components/icons/DigitalMenuIcon";
import TrialReminderDialog from "@/components/dashboard/TrialReminderDialog";
import TrialReminderHeaderBadge from "@/components/dashboard/TrialReminderHeaderBadge";
import { DashboardBreadcrumbs } from "@/components/dashboard/DashboardBreadcrumbs";
import { SetupNextBanner } from "@/components/dashboard/SetupNextBanner";
import {
  DashboardCommandPalette,
  useCommandPaletteHotkey,
} from "@/components/dashboard/DashboardCommandPalette";
import { DashboardMobileNav } from "@/components/dashboard/DashboardMobileNav";
import { NavBadge } from "@/components/dashboard/NavBadge";
import { DashboardPageLabelProvider, useDashboardPageLabelValue } from "@/contexts/dashboard-page-label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DashboardBannersProvider,
  useDashboardBannerState,
} from "@/contexts/dashboard-banners";
import { useTokenRefresh } from "@/hooks/use-token-refresh";
import { useAccessProfile } from "@/hooks/use-access-profile";
import { usePendingOrderCount } from "@/hooks/use-pending-order-count";
import {
  DASHBOARD_NAV_ITEMS,
  DASHBOARD_ROUTES,
  getVisibleDashboardNavGroups,
  isDashboardNavActive,
  isWideDashboardPath,
} from "@/lib/dashboard-routes";
import { hasScope } from "@/lib/auth-user";
import type { StoredUser } from "@/lib/api";
import { cn } from "@/lib/utils";

const NAV_ICONS = {
  overview: BarChart3,
  digitalMenu: DigitalMenuIcon,
  uberEats: UtensilsCrossed,
  orderPanel: MonitorSmartphone,
  reservations: CalendarDays,
  reports: TrendingUp,
  accounting: Calculator,
  menuUsers: Users,
  menuCustomers: UsersRound,
  campaigns: Megaphone,
  qrCodes: QrCode,
  account: User,
} as const;

const bannerStyles = {
  info: "bg-[color-mix(in_srgb,hsl(var(--card))_88%,hsl(217_91%_60%)_12%)] border-blue-500/20 text-blue-500 shadow-lg",
  warning: "bg-[color-mix(in_srgb,hsl(var(--card))_88%,hsl(var(--warning))_12%)] border-warning/20 text-warning shadow-lg",
  danger: "bg-[color-mix(in_srgb,hsl(var(--card))_88%,hsl(var(--destructive))_12%)] border-destructive/20 text-destructive shadow-lg",
};

const bannerIcons = { info: Info, warning: AlertTriangle, danger: XCircle };

const SIDEBAR_COLLAPSED_KEY = "algory-dashboard-sidebar-collapsed";

const SIDEBAR_ITEM =
  "flex h-10 w-full items-center justify-start gap-3 overflow-hidden rounded-lg px-2.5 text-sm font-medium transition-colors";

function sidebarItemClass(active: boolean) {
  return cn(
    SIDEBAR_ITEM,
    active
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

function sidebarLabelClass(collapsed: boolean) {
  return cn(
    "min-w-0 truncate whitespace-nowrap transition-opacity duration-200 ease-in-out",
    collapsed ? "pointer-events-none opacity-0 duration-150" : "opacity-100 delay-100",
  );
}

interface DashboardShellProps {
  initialUser?: StoredUser | null;
  children: ReactNode;
}

function DashboardShellInner({ children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { banners, addBanner, removeBanner } = useDashboardBannerState();
  const [portalReady, setPortalReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useTokenRefresh();
  const { data: accessProfile } = useAccessProfile();
  const visibleNavItems = useMemo(
    () =>
      DASHBOARD_NAV_ITEMS.filter((item) => {
        if (item.key === "reports") {
          return (
            hasScope(accessProfile, "SMART_REPORTING_OWNER") ||
            hasScope(accessProfile, "WAITER_PANEL_OWNER")
          );
        }
        return !item.requiredScope || hasScope(accessProfile, item.requiredScope);
      }),
    [accessProfile],
  );
  const visibleNavGroups = useMemo(
    () => getVisibleDashboardNavGroups(visibleNavItems),
    [visibleNavItems],
  );
  const showPendingBadge = hasScope(accessProfile, "WAITER_PANEL_OWNER");
  const { count: pendingOrderCount } = usePendingOrderCount(showPendingBadge);
  const [commandOpen, setCommandOpen] = useState(false);
  const toggleCommand = useCallback(() => setCommandOpen((open) => !open), []);
  useCommandPaletteHotkey(toggleCommand);

  useEffect(() => {
    const timer = window.setTimeout(() => setPortalReady(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const pageLabel = useDashboardPageLabelValue();

  const logout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("algory_user");
    }
    await axios.post("/api/auth/logout", undefined, { withCredentials: true }).catch(() => undefined);
    router.push("/login");
    router.refresh();
  };

  const bannerPortal =
    portalReady &&
    createPortal(
      <div className="fixed top-0 left-0 right-0 z-[9999] flex flex-col items-center pointer-events-none">
        <AnimatePresence>
          {banners.map((banner) => {
            const BannerIcon = bannerIcons[banner.type];
            return (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: -60 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -60 }}
                className={`pointer-events-auto mt-2 mx-4 w-full max-w-lg rounded-lg border px-4 py-3 flex items-center gap-3 shadow-lg ${bannerStyles[banner.type]}`}
              >
                <BannerIcon className="h-4 w-4 shrink-0" />
                <p className="text-sm flex-1">{banner.message}</p>
                <button onClick={() => removeBanner(banner.id)} className="shrink-0 opacity-60 hover:opacity-100">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>,
      document.body,
    );

  return (
    <DashboardBannersProvider onBanner={addBanner}>
      {bannerPortal}
      <TrialReminderDialog />
      <DashboardCommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <div className="flex h-svh overflow-hidden bg-background">
        <aside
          className={cn(
            "hidden h-full shrink-0 flex-col overflow-hidden border-r border-border bg-card/50 p-3 transition-[width] duration-300 ease-in-out lg:flex",
            collapsed ? "w-[4.5rem]" : "w-64",
          )}
        >
          <div className="flex h-10 shrink-0 items-center">
            <Tooltip open={collapsed ? undefined : false}>
              <TooltipTrigger asChild>
                <Link
                  href={DASHBOARD_ROUTES.overview}
                  className={cn(SIDEBAR_ITEM, "text-foreground hover:bg-muted hover:text-foreground")}
                >
                  <BrandLogo size="sm" />
                  <span className={cn(sidebarLabelClass(collapsed), "text-base font-bold")}>
                    Algory<span className="text-muted-foreground">QR</span>
                  </span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                AlgoryQR
              </TooltipContent>
            </Tooltip>
          </div>

          <nav className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden">
            {visibleNavGroups.map(({ group, items }) => (
              <div key={group.id} className="space-y-1">
                {group.label && !collapsed ? (
                  <p className="px-2.5 pb-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {group.label}
                  </p>
                ) : null}
                {items.map((item) => {
                  const Icon = NAV_ICONS[item.key];
                  const active = isDashboardNavActive(pathname, item.href);
                  const badgeCount =
                    item.badgeKey === "pendingOrders" ? pendingOrderCount : 0;
                  return (
                    <Tooltip key={item.key} open={collapsed ? undefined : false}>
                      <TooltipTrigger asChild>
                        <Link href={item.href} className={sidebarItemClass(active)}>
                          <Icon className="size-4 shrink-0" />
                          <span className={sidebarLabelClass(collapsed)}>{item.label}</span>
                          {!collapsed ? <NavBadge count={badgeCount} /> : null}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={12}>
                        {item.label}
                        {badgeCount > 0 ? ` (${badgeCount})` : ""}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="mt-3 shrink-0 space-y-1 border-t border-border pt-3">
            <Tooltip open={collapsed ? undefined : false}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className={sidebarItemClass(false)}
                  onClick={toggleCollapsed}
                  aria-label={collapsed ? "Menüyü genişlet" : "Menüyü küçült"}
                  aria-expanded={!collapsed}
                >
                  {collapsed ? (
                    <PanelLeft className="size-4 shrink-0" />
                  ) : (
                    <PanelLeftClose className="size-4 shrink-0" />
                  )}
                  <span className={sidebarLabelClass(collapsed)}>
                    {collapsed ? "Genişlet" : "Küçült"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                {collapsed ? "Menüyü genişlet" : "Menüyü küçült"}
              </TooltipContent>
            </Tooltip>

            <Tooltip open={collapsed ? undefined : false}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(sidebarItemClass(false), "text-muted-foreground")}
                  onClick={logout}
                  aria-label="Çıkış Yap"
                >
                  <LogOut className="size-4 shrink-0" />
                  <span className={sidebarLabelClass(collapsed)}>Çıkış Yap</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                Çıkış Yap
              </TooltipContent>
            </Tooltip>
          </div>
        </aside>

        <main className="relative min-h-0 flex-1 overflow-y-auto pb-20 lg:pb-0">
          <header className="flex items-center justify-between border-b border-border bg-card/50 px-4 py-3 lg:hidden">
            <Link href={DASHBOARD_ROUTES.overview} className="flex items-center gap-2">
              <BrandLogo size="md" />
              <span className="text-base font-bold">
                Algory<span className="text-muted-foreground">QR</span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setCommandOpen(true)}
                aria-label="Ara"
              >
                <Search className="size-4" />
              </Button>
              <TrialReminderHeaderBadge compact />
            </div>
          </header>

          <DashboardMobileNav items={visibleNavItems} pendingOrderCount={pendingOrderCount} />

          <div className="hidden items-center justify-end gap-3 border-b border-border bg-card/50 px-8 py-3 lg:flex">
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-2 text-sm text-muted-foreground"
              onClick={() => setCommandOpen(true)}
            >
              <Search className="size-4" />
              Ara
              <kbd className="rounded border border-border px-1.5 py-0.5 text-xs font-medium">
                Ctrl K
              </kbd>
            </Button>
            <TrialReminderHeaderBadge />
          </div>

          <div
            className={cn(
              "mx-auto p-6 lg:p-8",
              isWideDashboardPath(pathname) ? "max-w-5xl" : "max-w-3xl",
            )}
          >
            <DashboardBreadcrumbs pathname={pathname} currentLabel={pageLabel} />
            <SetupNextBanner />
            {children}
          </div>
        </main>
      </div>
    </DashboardBannersProvider>
  );
}

export default function DashboardShell(props: DashboardShellProps) {
  return (
    <DashboardPageLabelProvider>
      <DashboardShellInner {...props} />
    </DashboardPageLabelProvider>
  );
}
