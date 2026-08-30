"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calculator,
  Megaphone,
  Menu,
  MonitorSmartphone,
  QrCode,
  TrendingUp,
  User,
  Users,
  UsersRound,
  UtensilsCrossed,
} from "lucide-react";

import { DigitalMenuIcon } from "@/components/icons/DigitalMenuIcon";
import { NavBadge } from "@/components/dashboard/NavBadge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  isDashboardNavActive,
  splitMobileDashboardNav,
  type DashboardNavItem,
} from "@/lib/dashboard-routes";
import { cn } from "@/lib/utils";

const NAV_ICONS = {
  overview: BarChart3,
  digitalMenu: DigitalMenuIcon,
  trendyolGo: UtensilsCrossed,
  orderPanel: MonitorSmartphone,
  reports: TrendingUp,
  accounting: Calculator,
  menuUsers: Users,
  menuCustomers: UsersRound,
  campaigns: Megaphone,
  qrCodes: QrCode,
  account: User,
} as const;

type DashboardMobileNavProps = {
  items: DashboardNavItem[];
  pendingOrderCount: number;
};

function tabClass(active: boolean) {
  return cn(
    "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium",
    active ? "text-foreground" : "text-muted-foreground",
  );
}

export function DashboardMobileNav({ items, pendingOrderCount }: DashboardMobileNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { primary, overflow } = splitMobileDashboardNav(items);
  const moreActive = overflow.some((item) => isDashboardNavActive(pathname, item.href));
  const columns = overflow.length > 0 ? primary.length + 1 : primary.length;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Mobil gezinme"
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {primary.map((item) => {
          const Icon = NAV_ICONS[item.key];
          const active = isDashboardNavActive(pathname, item.href);
          const badgeCount = item.badgeKey === "pendingOrders" ? pendingOrderCount : 0;
          return (
            <Link key={item.key} href={item.href} className={tabClass(active)}>
              <span className="relative">
                <Icon className="size-4" />
                {badgeCount > 0 ? (
                  <span className="absolute -right-2.5 -top-1 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-semibold text-destructive-foreground">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                ) : null}
              </span>
              <span className="truncate">{item.mobileLabel}</span>
            </Link>
          );
        })}
        {overflow.length > 0 ? (
          <button type="button" className={tabClass(moreActive)} onClick={() => setMoreOpen(true)}>
            <Menu className="size-4" />
            <span>Daha fazla</span>
          </button>
        ) : null}
      </div>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[70vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Daha fazla</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid gap-1">
            {overflow.map((item) => {
              const Icon = NAV_ICONS[item.key];
              const active = isDashboardNavActive(pathname, item.href);
              const badgeCount = item.badgeKey === "pendingOrders" ? pendingOrderCount : 0;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                    active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  <NavBadge count={badgeCount} />
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
