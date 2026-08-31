"use client";

import type { ReactNode } from "react";

import type { MenuProfileApiItem } from "@/lib/api";
import { usePublicMenuTheme } from "../shared/public-menu-theme";
import { TechGourmetNavbar } from "./Navbar";
import { TechGourmetFooter } from "./Footer";

type TechGourmetShellProps = {
  menu: Pick<MenuProfileApiItem, "businessName" | "logoUrl" | "phone" | "email" | "address" | "qrId">;
  children: ReactNode;
};

export function TechGourmetShell({ menu, children }: TechGourmetShellProps) {
  const theme = usePublicMenuTheme();
  return (
    <div
      className="tech-gourmet-menu flex min-h-[100dvh] flex-col"
      style={{ backgroundColor: "var(--tg-bg)", color: "var(--tg-fg)" }}
    >
      <style>{theme.styles}</style>
      <TechGourmetNavbar menu={menu} />
      <div className="flex-1">{children}</div>
      <TechGourmetFooter menu={menu} />
    </div>
  );
}
