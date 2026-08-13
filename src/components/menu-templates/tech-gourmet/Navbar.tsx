"use client";

import { ShoppingBag, Menu } from "lucide-react";

import type { MenuProfileApiItem } from "@/lib/api";
import { MenuBrandLogo } from "../shared/MenuBrandLogo";
import { MenuLanguagePicker } from "../shared/MenuLanguagePicker";
import { useMenuExperienceOptional } from "../shared/menu-experience";
import { useOrderingOptional } from "../shared/ordering-context";

type TechGourmetNavbarProps = {
  menu: Pick<MenuProfileApiItem, "businessName" | "logoUrl">;
};

export function TechGourmetNavbar({ menu }: TechGourmetNavbarProps) {
  const experience = useMenuExperienceOptional();
  const ordering = useOrderingOptional();

  return (
    <header
      className="sticky top-0 z-40 flex h-16 items-center justify-between px-4 sm:px-6"
      style={{
        backgroundColor: "var(--tg-bg)",
        borderBottom: "1px solid var(--tg-outline-variant)",
      }}
    >
      <button
        type="button"
        onClick={() => experience?.backToLandingHub()}
        className="flex h-10 w-10 items-center justify-center transition-colors"
        style={{ color: "var(--tg-fg-variant)" }}
        aria-label="Menü"
      >
        <Menu size={20} />
      </button>

      <button
        type="button"
        onClick={() => experience?.backToLandingHub()}
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
      >
        {menu.logoUrl ? (
          <MenuBrandLogo logoUrl={menu.logoUrl} businessName={menu.businessName} size={28} />
        ) : null}
        <span
          className="font-headline text-base tracking-tighter uppercase"
          style={{ color: "var(--tg-fg)", fontFamily: "var(--tg-font-display)", fontWeight: 700 }}
        >
          {menu.businessName}
        </span>
      </button>

      <div className="flex items-center gap-2">
        <MenuLanguagePicker variant="dropdown" />
        {ordering ? (
          <button
            type="button"
            onClick={() => ordering.setCartOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center transition-colors"
            style={{ color: "var(--tg-fg-variant)" }}
            aria-label="Sepet"
          >
            <ShoppingBag size={20} />
            {ordering.cartCount > 0 ? (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center px-1 text-[10px] font-semibold"
                style={{
                  backgroundColor: "var(--tg-primary)",
                  color: "var(--tg-on-primary)",
                  fontFamily: "var(--tg-font-mono)",
                }}
              >
                {ordering.cartCount > 99 ? "99+" : ordering.cartCount}
              </span>
            ) : null}
          </button>
        ) : null}
      </div>
    </header>
  );
}
