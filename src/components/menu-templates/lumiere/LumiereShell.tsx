import type { ReactNode } from "react";

import type { MenuProfileApiItem } from "@/lib/api";
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
    <div className="lumiere-menu relative flex min-h-screen flex-col overflow-x-hidden">
      <style>{LUMIERE_STYLES}</style>
      <LumiereTopNav
        businessName={menu.businessName}
        variant={topVariant}
        onBack={onBack}
        onHome={onHome}
      />
      <main className={`flex-grow pb-10 ${topVariant === "detail" ? "pt-16" : ""}`}>
        {children}
      </main>
    </div>
  );
}
