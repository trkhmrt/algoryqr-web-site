"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { cn } from "@/lib/utils";

const HUB_TABS = [
  { href: DASHBOARD_ROUTES.digitalMenu, label: "Şubeler" },
  { href: DASHBOARD_ROUTES.digitalMenuMenus, label: "Menüler" },
  { href: DASHBOARD_ROUTES.reservations, label: "Rezervasyonlar" },
] as const;

export function DigitalMenuHubTabs() {
  const pathname = usePathname();

  return (
    <div className="inline-flex rounded-2xl border border-border bg-muted p-1 shadow-none">
      {HUB_TABS.map((tab) => {
        const active =
          pathname === tab.href ||
          (tab.href === DASHBOARD_ROUTES.reservations && pathname.startsWith(`${tab.href}/`));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
