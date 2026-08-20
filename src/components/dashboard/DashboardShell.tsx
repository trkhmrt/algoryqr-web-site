"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  CalendarDays,
  Calculator,
  Megaphone,
} from "lucide-react";

import { DigitalMenuIcon } from "@/components/icons/DigitalMenuIcon";
import TrialReminderDialog from "@/components/dashboard/TrialReminderDialog";
import TrialReminderHeaderBadge from "@/components/dashboard/TrialReminderHeaderBadge";
import { ReportIssueFloatingButton } from "@/components/dashboard/ReportIssueFloatingButton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DashboardBannersProvider,
  useDashboardBannerState,
} from "@/contexts/dashboard-banners";
import { useTokenRefresh } from "@/hooks/use-token-refresh";
import { useAccessProfile } from "@/hooks/use-access-profile";
import {
  DASHBOARD_NAV_ITEMS,
  DASHBOARD_ROUTES,
  isDashboardNavActive,
} from "@/lib/dashboard-routes";
import { hasScope } from "@/lib/auth-user";
import type { StoredUser } from "@/lib/api";
import { getStoredUser } from "@/lib/api";
import { cn } from "@/lib/utils";

const NAV_ICONS = {
  overview: BarChart3,
  digitalMenu: DigitalMenuIcon,
  reservations: CalendarDays,
  orderPanel: MonitorSmartphone,
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

function mobileNavItemClass(active: boolean) {
  return cn(
    "flex-1 whitespace-nowrap rounded-lg border bg-white px-3 py-2.5 text-center text-xs font-medium transition-colors sm:text-sm dark:bg-card",
    active
      ? "border-transparent bg-muted text-foreground"
      : "border-border/70 text-muted-foreground hover:text-foreground",
  );
}

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

function DashboardShellInner({ initialUser = null, children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { banners, addBanner, removeBanner } = useDashboardBannerState();
  const [portalReady, setPortalReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useTokenRefresh();
  const { data: accessProfile } = useAccessProfile();
  const visibleNavItems = useMemo(
    () =>
      DASHBOARD_NAV_ITEMS.filter(
        (item) => !item.requiredScope || hasScope(accessProfile, item.requiredScope),
      ),
    [accessProfile],
  );

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

  const user = useMemo(() => initialUser || getStoredUser(), [initialUser]);
  const userInitials = useMemo(() => {
    if (!user) return "?";
    return (
      ((user.first_name?.[0] || "") + (user.last_name?.[0] || "")).toUpperCase() ||
      user.email?.[0]?.toUpperCase() ||
      "?"
    );
  }, [user]);
  const userFullName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "Kullanıcı";

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
      <ReportIssueFloatingButton />
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
                  href="/"
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

          <nav className="mt-3 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden">
            {visibleNavItems.map((item) => {
              const Icon = NAV_ICONS[item.key];
              const active = isDashboardNavActive(pathname, item.href);
              return (
                <Tooltip key={item.key} open={collapsed ? undefined : false}>
                  <TooltipTrigger asChild>
                    <Link href={item.href} className={sidebarItemClass(active)}>
                      <Icon className="size-4 shrink-0" />
                      <span className={sidebarLabelClass(collapsed)}>{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
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

        <main className="relative min-h-0 flex-1 overflow-y-auto">
          <header className="flex items-center justify-between border-b border-border bg-card/50 px-4 py-3 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <BrandLogo size="md" />
              <span className="text-base font-bold">
                Algory<span className="text-muted-foreground">QR</span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <TrialReminderHeaderBadge compact />
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-primary transition-opacity hover:opacity-80"
                    aria-label="Profil menusu"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>{userFullName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(DASHBOARD_ROUTES.account)}>
                    <User className="mr-2 h-4 w-4" />
                    Hesabım
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="overflow-x-auto border-b border-border [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:hidden">
            <div className="flex min-w-full gap-1.5 py-2 pl-2 pr-2">
              {visibleNavItems.map((item) => {
                const active = isDashboardNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={mobileNavItemClass(active)}
                  >
                    {item.mobileLabel}
                  </Link>
                );
              })}
              <span aria-hidden className="w-2 shrink-0" />
            </div>
          </div>

          <div className="hidden items-center justify-end gap-3 border-b border-border bg-card/50 px-8 py-3 lg:flex">
            <TrialReminderHeaderBadge />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium leading-none text-foreground">{userFullName}</p>
                {user?.email && <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>}
              </div>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-primary transition-opacity hover:opacity-80"
                    aria-label="Profil menusu"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>{userFullName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(DASHBOARD_ROUTES.account)}>
                    <User className="mr-2 h-4 w-4" />
                    Hesabım
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div
            className={cn(
              "mx-auto p-6 lg:p-8",
              pathname === DASHBOARD_ROUTES.overview ? "max-w-5xl" : "max-w-3xl",
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </DashboardBannersProvider>
  );
}

export default function DashboardShell(props: DashboardShellProps) {
  return <DashboardShellInner {...props} />;
}
