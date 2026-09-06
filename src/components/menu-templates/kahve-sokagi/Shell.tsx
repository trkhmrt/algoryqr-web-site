"use client";

import { useEffect, useState, type ReactNode } from "react";

import type { MenuProfileApiItem } from "@/lib/api";
import { usePublicMenuTheme } from "../shared/public-menu-theme";

import { KahveBottomNav } from "./BottomNav";
import { KahveCartTray } from "./CartTray";
import { KahveSokagiFooter } from "./Footer";
import type { KahveHomeTab } from "./category-utils";
import { KAHVE_ALL_TAB } from "./category-utils";

type ShellProps = {
  menu: Pick<
    MenuProfileApiItem,
    | "phone"
    | "email"
    | "address"
    | "qrId"
    | "businessName"
    | "publicId"
    | "chefName"
    | "chefDisplayName"
    | "chefAvatarUrl"
  >;
  children: ReactNode;
  homeTab: KahveHomeTab;
  onSelectHomeTab: (tab: KahveHomeTab) => void;
  onBrandClick?: () => void;
};

export function KahveSokagiShell({
  menu,
  children,
  homeTab,
  onSelectHomeTab,
  onBrandClick,
}: ShellProps) {
  const theme = usePublicMenuTheme();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (text: string) => setToast(text);

  return (
    <div className="kahve-sokagi-menu flex min-h-[100dvh] flex-col lx-bg select-none">
      <style>{theme.styles}</style>
      <div className="relative mx-auto flex w-full max-w-[480px] flex-1 flex-col">
        <div className="flex-1">{children}</div>
        <KahveSokagiFooter menu={menu} />
      </div>

      <KahveCartTray onCallWaiter={() => showToast("Garson masanıza yönlendirildi!")} />

      <KahveBottomNav
        publicId={menu.publicId ?? ""}
        chefName={menu.chefName}
        chefDisplayName={menu.chefDisplayName}
        chefAvatarUrl={menu.chefAvatarUrl}
        activeTab={homeTab}
        onSelectTab={(tab) => {
          onSelectHomeTab(tab);
          onBrandClick?.();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onAbout={() => {
          onSelectHomeTab({ type: KAHVE_ALL_TAB });
          onBrandClick?.();
          showToast(`${menu.businessName} · ${theme.footerKicker}`);
          window.setTimeout(() => {
            document
              .querySelector(".menu-footer")
              ?.scrollIntoView({ behavior: "smooth", block: "end" });
          }, 50);
        }}
        onCallWaiter={() => showToast("Garson çağrısı yapıldı!")}
      />

      <div
        className={`pointer-events-none fixed left-1/2 top-20 z-50 flex max-w-[90%] -translate-x-1/2 items-center gap-2 truncate rounded-2xl border border-[color-mix(in_srgb,var(--ks-secondary)_40%,transparent)] bg-[color-mix(in_srgb,var(--ks-primary)_95%,transparent)] px-4 py-2.5 text-xs font-medium text-white shadow-2xl transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <span id="toast-text">{toast ?? ""}</span>
      </div>
    </div>
  );
}
