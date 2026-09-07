"use client";

import type { ReactNode } from "react";

import type { MenuProfileApiItem } from "@/lib/api";
import { usePublicMenuTheme } from "../shared/public-menu-theme";
import { ModernBistroCartBar } from "./CartBar";
import { ModernBistroFooter } from "./Footer";
import { ModernBistroHeroBanner } from "./HeroBanner";
import { ModernBistroNavbar } from "./Navbar";

type ModernBistroShellProps = {
  menu: Pick<
    MenuProfileApiItem,
    | "businessName"
    | "logoUrl"
    | "phone"
    | "email"
    | "address"
    | "qrId"
    | "publicId"
    | "chefName"
    | "chefDisplayName"
    | "chefAvatarUrl"
    | "slogan"
  >;
  children: ReactNode;
  onBrandClick?: () => void;
};

export function ModernBistroShell({ menu, children, onBrandClick }: ModernBistroShellProps) {
  const theme = usePublicMenuTheme();
  return (
    <div className="modern-bistro-menu flex min-h-[100dvh] flex-col">
      <style>{theme.styles}</style>
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
        <ModernBistroHeroBanner
          businessName={menu.businessName}
          logoUrl={menu.logoUrl}
          slogan={menu.slogan}
          phone={menu.phone}
          address={menu.address}
          onBrandClick={onBrandClick}
        />
        <ModernBistroNavbar menu={menu} />
        <div className="flex-1 pb-24">{children}</div>
        <ModernBistroFooter menu={menu} />
      </div>
      <ModernBistroCartBar />
    </div>
  );
}
