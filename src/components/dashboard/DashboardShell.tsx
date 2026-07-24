"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  QrCode,
  LogOut,
  BarChart3,
  User,
  Info,
  AlertTriangle,
  XCircle,
  X,
  UtensilsCrossed,
} from "lucide-react";

import TrialStatusBanner from "@/components/dashboard/TrialStatusBanner";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  DashboardBannersProvider,
  useDashboardBannerState,
} from "@/contexts/dashboard-banners";
import { useTokenRefresh } from "@/hooks/use-token-refresh";
import {
  DASHBOARD_NAV_ITEMS,
  DASHBOARD_ROUTES,
  isDashboardNavActive,
} from "@/lib/dashboard-routes";
import type { StoredUser } from "@/lib/api";
import { getStoredUser } from "@/lib/api";
import { cn } from "@/lib/utils";

const NAV_ICONS = {
  overview: BarChart3,
  digitalMenu: UtensilsCrossed,
  qrCodes: QrCode,
  account: User,
} as const;

const bannerStyles = {
  info: "bg-[color-mix(in_srgb,hsl(var(--card))_88%,hsl(217_91%_60%)_12%)] border-blue-500/20 text-blue-500 shadow-lg",
  warning: "bg-[color-mix(in_srgb,hsl(var(--card))_88%,hsl(var(--warning))_12%)] border-warning/20 text-warning shadow-lg",
  danger: "bg-[color-mix(in_srgb,hsl(var(--card))_88%,hsl(var(--destructive))_12%)] border-destructive/20 text-destructive shadow-lg",
};

const bannerIcons = { info: Info, warning: AlertTriangle, danger: XCircle };

interface DashboardShellProps {
  initialUser?: StoredUser | null;
  children: ReactNode;
}

function DashboardShellInner({ initialUser = null, children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { banners, addBanner, removeBanner } = useDashboardBannerState();
  const [portalReady, setPortalReady] = useState(false);
  useTokenRefresh();

  useEffect(() => {
    const timer = window.setTimeout(() => setPortalReady(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

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
      <div className="flex min-h-screen bg-background">
        <aside className="hidden w-64 flex-col gap-6 border-r border-border bg-card/50 p-6 lg:flex">
          <Link href="/" className="flex items-center gap-2">
            <QrCode className="h-6 w-6 text-foreground" />
            <span className="text-lg font-bold">
              Algory<span className="text-muted-foreground">QR</span>
            </span>
          </Link>

          <nav className="flex flex-1 flex-col gap-1">
            {DASHBOARD_NAV_ITEMS.map((item) => {
              const Icon = NAV_ICONS[item.key];
              const active = isDashboardNavActive(pathname, item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Çıkış Yap
            </Button>
          </div>
        </aside>

        <main className="relative flex-1 overflow-auto">
          <header className="flex items-center justify-between border-b border-border bg-card/50 px-4 py-3 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-foreground" />
              <span className="text-base font-bold">
                Algory<span className="text-muted-foreground">QR</span>
              </span>
            </Link>
            <ThemeToggle />
          </header>

          <div className="overflow-x-auto border-b border-border lg:hidden">
            <div className="flex min-w-full">
              {DASHBOARD_NAV_ITEMS.map((item) => {
                const active = isDashboardNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "flex-1 whitespace-nowrap border-b-2 px-3 py-3 text-center text-xs font-medium transition-colors sm:text-sm",
                      active
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.mobileLabel}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden items-center justify-end gap-3 border-b border-border bg-card/50 px-8 py-3 lg:flex">
            <ThemeToggle />
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium leading-none text-foreground">{userFullName}</p>
                {user?.email && <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>}
              </div>
              <Link
                href={DASHBOARD_ROUTES.account}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary transition-opacity hover:opacity-80"
              >
                <span className="text-xs font-semibold text-primary-foreground">{userInitials}</span>
              </Link>
            </div>
          </div>

          <div className="mx-auto max-w-6xl p-6 lg:p-8">
            <TrialStatusBanner />
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
