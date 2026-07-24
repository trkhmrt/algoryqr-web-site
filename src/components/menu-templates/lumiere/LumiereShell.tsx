import type { ReactNode } from "react";

import type { MenuProfileApiItem } from "@/lib/api";
import { LumiereBottomNav } from "./BottomNav";
import type { LumiereNavTab } from "./category-utils";
import { LumiereTopNav } from "./TopNav";
import { LUMIERE_STYLES } from "./styles";

type ShellProps = {
  menu: MenuProfileApiItem;
  activeNav: LumiereNavTab;
  topVariant?: "home" | "detail";
  onBack?: () => void;
  onMenu: () => void;
  onSearch: () => void;
  onSpecials: () => void;
  onInfo: () => void;
  children: ReactNode;
};

export function LumiereShell({
  menu,
  activeNav,
  topVariant = "home",
  onBack,
  onMenu,
  onSearch,
  onSpecials,
  onInfo,
  children,
}: ShellProps) {
  return (
    <div className="lumiere-menu relative flex min-h-screen flex-col overflow-x-hidden">
      <style>{LUMIERE_STYLES}</style>
      <LumiereTopNav
        businessName={menu.businessName}
        variant={topVariant}
        onBack={onBack}
      />
      <main className={`flex-grow pb-24 ${topVariant === "detail" ? "pt-16" : ""}`}>
        {children}
      </main>
      <LumiereBottomNav
        active={activeNav}
        onMenu={onMenu}
        onSearch={onSearch}
        onSpecials={onSpecials}
        onInfo={onInfo}
      />
    </div>
  );
}
