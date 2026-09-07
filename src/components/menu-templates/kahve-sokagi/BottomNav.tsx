"use client";

import { type ReactNode } from "react";
import { Bell, Flame, Store, Utensils } from "lucide-react";

import { cn } from "@/lib/utils";
import { useMenuLocale } from "../shared/menu-locale";
import { useOrderingOptional } from "../shared/ordering-context";

import { KahveChefAskButton } from "./ChefAskButton";
import { KAHVE_ALL_TAB, KAHVE_FEATURED_TAB, type KahveHomeTab } from "./category-utils";

type KahveBottomNavProps = {
  publicId: string;
  chefName?: string | null;
  chefDisplayName?: string | null;
  chefAvatarUrl?: string | null;
  activeTab: KahveHomeTab;
  onSelectTab: (tab: KahveHomeTab) => void;
  onAbout: () => void;
  onCallWaiter: () => void;
};

export function KahveBottomNav({
  publicId,
  chefName,
  chefDisplayName,
  chefAvatarUrl,
  activeTab,
  onSelectTab,
  onAbout,
  onCallWaiter,
}: KahveBottomNavProps) {
  const { t } = useMenuLocale();
  const ordering = useOrderingOptional();
  const menuActive = activeTab.type === KAHVE_ALL_TAB || activeTab.type === "category";
  const featuredActive = activeTab.type === KAHVE_FEATURED_TAB;

  return (
    <nav className="fixed bottom-0 z-50 w-full border-t border-[var(--lx-border)] bg-[color-mix(in_srgb,var(--ks-surface)_95%,transparent)] pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_16px_rgba(49,25,8,0.05)] backdrop-blur-xl">
      <div className="relative mx-auto grid h-14 max-w-[480px] grid-cols-5 items-center px-1">
        <NavItem
          active={menuActive}
          label={t.menuTitle}
          onClick={() => onSelectTab({ type: KAHVE_ALL_TAB })}
          icon={<Utensils className="h-5 w-5" strokeWidth={menuActive ? 2.25 : 1.75} />}
        />
        <NavItem
          active={featuredActive}
          label={t.popular}
          onClick={() => onSelectTab({ type: KAHVE_FEATURED_TAB })}
          icon={<Flame className="h-5 w-5" strokeWidth={featuredActive ? 2.25 : 1.75} />}
        />

        <div className="flex items-center justify-center">
          <KahveChefAskButton
            publicId={publicId}
            chefName={chefName}
            chefDisplayName={chefDisplayName}
            chefAvatarUrl={chefAvatarUrl}
          />
        </div>

        <NavItem
          active={false}
          label="Hakkımızda"
          onClick={onAbout}
          icon={<Store className="h-5 w-5" strokeWidth={1.75} />}
        />
        <NavItem
          active={false}
          label={ordering ? t.cart : "Garson"}
          onClick={() => {
            if (ordering && ordering.cartCount > 0) {
              ordering.setCartOpen(true);
              return;
            }
            onCallWaiter();
          }}
          icon={<Bell className="h-5 w-5" strokeWidth={1.75} />}
          badge={ordering && ordering.cartCount > 0 ? ordering.cartCount : undefined}
        />
      </div>
    </nav>
  );
}

function NavItem({
  active,
  label,
  onClick,
  icon,
  badge,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: ReactNode;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center gap-0.5 pb-0.5 transition-colors",
        active ? "font-bold text-[var(--ks-secondary)]" : "text-[var(--lx-muted)] hover:text-[var(--ks-primary)]",
      )}
    >
      <span className="relative">
        {icon}
        {badge != null && badge > 0 ? (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--ks-secondary)] px-1 text-[9px] font-bold text-white">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </span>
      <span className="text-[10px] tracking-tight">{label}</span>
    </button>
  );
}
