import type { ReactNode } from "react";

import type { MenuProfileApiItem } from "@/lib/api";
import { MenuViewportFrame } from "../shared";
import { LumiereTopNav } from "./TopNav";
import { LUMIERE_STYLES } from "./styles";

type ShellProps = {
  menu: MenuProfileApiItem;
  topVariant?: "home" | "detail";
  onBack?: () => void;
  onHome?: () => void;
  children: ReactNode;
};

export function LumiereShell({
  menu,
  topVariant = "home",
  onBack,
  onHome,
  children,
}: ShellProps) {
  return (
    <MenuViewportFrame frameBgClassName="lumiere-menu" innerClassName="lumiere-menu">
      <style>{LUMIERE_STYLES}</style>
      <LumiereTopNav
        businessName={menu.businessName}
        logoUrl={menu.logoUrl}
        variant={topVariant}
        onBack={onBack}
        onHome={onHome}
      />
      <main className={`flex-grow pb-16 ${topVariant === "detail" ? "pt-14" : ""}`}>
        {children}
      </main>
    </MenuViewportFrame>
  );
}
