"use client";

import type { ReactNode } from "react";

import type { MenuProfileApiItem } from "@/lib/api";
import { MenuAtmosphereBackdrop } from "../shared/MenuAtmosphereBackdrop";
import { usePublicMenuTheme } from "../shared/public-menu-theme";
import { MaisonNoirCartBar } from "./CartBar";
import { MaisonNoirFooter } from "./Footer";
import { MaisonNoirNavbar } from "./Navbar";

type MenuChrome = Pick<
  MenuProfileApiItem,
  "businessName" | "logoUrl" | "phone" | "email" | "address" | "qrId"
>;

type MaisonNoirShellProps = {
  menu: MenuChrome;
  children: ReactNode;
  onBrandClick?: () => void;
};

export function MaisonNoirShell({ menu, children, onBrandClick }: MaisonNoirShellProps) {
  const theme = usePublicMenuTheme();

  return (
    <div className="maison-noir-menu relative flex min-h-[100dvh] flex-col">
      <style>{theme.styles}</style>
      <MenuAtmosphereBackdrop imageUrl={theme.heroImage} variant="immersive" />
      <div className="mn-content-layer flex min-h-[100dvh] flex-col">
        <MaisonNoirNavbar menu={menu} onBrandClick={onBrandClick} />
        <div className="flex-1 pb-24">{children}</div>
        <MaisonNoirFooter menu={menu} />
        <MaisonNoirCartBar />
      </div>
    </div>
  );
}
