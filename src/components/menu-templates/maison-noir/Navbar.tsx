"use client";

import { Menu, ShoppingBag } from "lucide-react";

import type { MenuProfileApiItem } from "@/lib/api";
import { MenuLanguagePicker } from "../shared/MenuLanguagePicker";
import { useMenuExperienceOptional } from "../shared/menu-experience";
import { useOrderingOptional } from "../shared/ordering-context";

type MaisonNoirNavbarProps = {
  menu: Pick<MenuProfileApiItem, "businessName" | "logoUrl">;
  onBrandClick?: () => void;
};

export function MaisonNoirNavbar({ menu, onBrandClick }: MaisonNoirNavbarProps) {
  const experience = useMenuExperienceOptional();
  const ordering = useOrderingOptional();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--mn-border)] bg-[var(--mn-bg)]/90 backdrop-blur-md">
      <div className="relative mx-auto flex h-14 max-w-xl items-center justify-between px-6 sm:px-8">
        <button
          type="button"
          onClick={() => experience?.backToLandingHub()}
          className="flex h-10 w-10 items-center justify-center text-[var(--mn-fg)]/80 transition-colors hover:text-[var(--mn-primary)]"
          aria-label="Menü"
        >
          <Menu className="h-4 w-4" strokeWidth={1.25} />
        </button>

        <button
          type="button"
          onClick={() => {
            onBrandClick?.();
            experience?.backToLandingHub();
          }}
          className="absolute left-1/2 max-w-[min(100%,200px)] -translate-x-1/2 mn-tracked text-[0.58rem] text-[var(--mn-muted)] transition-colors hover:text-[var(--mn-primary)]"
        >
          {menu.businessName}
        </button>

        <div className="flex items-center gap-1">
          <MenuLanguagePicker variant="dropdown" />
          {ordering ? (
            <button
              type="button"
              onClick={() => ordering.setCartOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center text-[var(--mn-fg)]/80 transition-colors hover:text-[var(--mn-primary)]"
              aria-label="Sepet"
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={1.25} />
              {ordering.cartCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--mn-primary)] px-1 text-[10px] font-medium text-[var(--mn-primary-fg)]">
                  {ordering.cartCount > 99 ? "99+" : ordering.cartCount}
                </span>
              ) : null}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
