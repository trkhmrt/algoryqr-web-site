"use client";

import type { ReactNode } from "react";

import type { MenuProfileApiItem } from "@/lib/api";
import { usePublicMenuTheme } from "../shared/public-menu-theme";
import { CleverDishScribeCartBar } from "./CartBar";
import { CleverDishScribeFooter } from "./Footer";
import { CleverDishScribeNavbar } from "./Navbar";

type CleverDishScribeShellProps = {
  menu: Pick<MenuProfileApiItem, "businessName" | "logoUrl" | "phone" | "email" | "address">;
  children: ReactNode;
};

export function CleverDishScribeShell({ menu, children }: CleverDishScribeShellProps) {
  const theme = usePublicMenuTheme();
  return (
    <div className="clever-dish-scribe-menu flex min-h-[100dvh] flex-col">
      <style>{theme.styles}</style>
      <CleverDishScribeNavbar menu={menu} />
      <div className="flex-1 pb-24">{children}</div>
      <CleverDishScribeFooter menu={menu} />
      <CleverDishScribeCartBar />
    </div>
  );
}
