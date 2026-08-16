"use client";

import type { ReactNode } from "react";

import type { MenuProfileApiItem } from "@/lib/api";
import { usePublicMenuTheme } from "../shared/public-menu-theme";
import { ModernBistroCartBar } from "./CartBar";
import { ModernBistroFooter } from "./Footer";
import { ModernBistroNavbar } from "./Navbar";

type ModernBistroShellProps = {
  menu: Pick<MenuProfileApiItem, "businessName" | "logoUrl" | "phone" | "email" | "address">;
  children: ReactNode;
};

export function ModernBistroShell({ menu, children }: ModernBistroShellProps) {
  const theme = usePublicMenuTheme();
  return (
    <div className="modern-bistro-menu flex min-h-[100dvh] flex-col">
      <style>{theme.styles}</style>
      <ModernBistroNavbar menu={menu} />
      <div className="flex-1 pb-24">{children}</div>
      <ModernBistroFooter menu={menu} />
      <ModernBistroCartBar />
    </div>
  );
}
