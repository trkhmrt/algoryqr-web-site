"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { MenuProfileApiItem } from "@/lib/api";

import { usePublicMenuTheme } from "../shared/public-menu-theme";
import { LuxuryFooter } from "./LuxuryFooter";
import { LuxuryNavbar } from "./LuxuryNavbar";

type LuxurySiteLayoutProps = {
  menu: Pick<MenuProfileApiItem, "businessName" | "logoUrl" | "phone" | "email" | "address" | "qrId">;
  children: ReactNode;
  showNav?: boolean;
  contentClassName?: string;
};

export function LuxurySiteLayout({
  menu,
  children,
  showNav = true,
  contentClassName,
}: LuxurySiteLayoutProps) {
  const theme = usePublicMenuTheme();
  return (
    <div className={cn(theme.rootClassName, "flex min-h-[100dvh] flex-col lx-bg")}>
      <style>{theme.styles}</style>
      <LuxuryNavbar menu={menu} showNav={showNav} />
      <div className={cn("flex-1", contentClassName)}>{children}</div>
      <LuxuryFooter menu={menu} />
    </div>
  );
}
