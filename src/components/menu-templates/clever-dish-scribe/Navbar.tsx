"use client";

import { Menu, ShoppingBag } from "lucide-react";

import type { MenuProfileApiItem } from "@/lib/api";
import { MenuBrandLogo } from "../shared/MenuBrandLogo";
import { MenuLanguagePicker } from "../shared/MenuLanguagePicker";
import { useMenuExperienceOptional } from "../shared/menu-experience";
import { useOrderingOptional } from "../shared/ordering-context";

type CleverDishScribeNavbarProps = {
  menu: Pick<MenuProfileApiItem, "businessName" | "logoUrl">;
};

export function CleverDishScribeNavbar({ menu }: CleverDishScribeNavbarProps) {
  const experience = useMenuExperienceOptional();
  const ordering = useOrderingOptional();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--cds-border)] bg-[var(--cds-bg)]/92 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <button
          type="button"
          onClick={() => experience?.backToLandingHub()}
          className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--cds-fg)] transition-colors hover:bg-[var(--cds-surface)]"
          aria-label="Menü"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => experience?.backToLandingHub()}
          className="absolute left-1/2 flex max-w-[min(100%,220px)] -translate-x-1/2 items-center gap-2"
        >
          {menu.logoUrl ? (
            <MenuBrandLogo logoUrl={menu.logoUrl} businessName={menu.businessName} size={24} />
          ) : null}
          <span className="truncate text-base font-semibold tracking-tight text-[var(--cds-fg)]">
            {menu.businessName}
          </span>
        </button>

        <div className="flex items-center gap-1">
          <MenuLanguagePicker variant="dropdown" />
          {ordering ? (
            <button
              type="button"
              onClick={() => ordering.setCartOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-[var(--cds-fg)] transition-colors hover:bg-[var(--cds-surface)]"
              aria-label="Sepet"
            >
              <ShoppingBag className="h-5 w-5" />
              {ordering.cartCount > 0 ? (
                <span
                  key={ordering.cartCount}
                  className="cds-badge-pop absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--cds-accent)] px-1 text-[10px] font-semibold text-[#052e16]"
                >
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
