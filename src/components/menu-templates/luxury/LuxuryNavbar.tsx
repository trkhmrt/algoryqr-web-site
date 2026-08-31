"use client";

import { Suspense, useState } from "react";
import { Menu, ShoppingBag, UserRound, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MenuProfileApiItem } from "@/lib/api";
import { usePublicMenuNavigation } from "@/hooks/use-public-menu-navigation";

import { useCustomerAccountUi } from "../shared/CustomerAccountMenu";
import { MenuBrandLogo } from "../shared/MenuBrandLogo";
import { MenuLanguagePicker } from "../shared/MenuLanguagePicker";
import { useOrderingOptional } from "../shared/ordering-context";

const NAV_ITEMS: Array<{
  key: "landing" | "menu";
  label: string;
}> = [
  { key: "landing", label: "Ana sayfa" },
  { key: "menu", label: "Menü" },
];

type LuxuryNavbarProps = {
  menu: Pick<MenuProfileApiItem, "businessName" | "logoUrl" | "qrId">;
  showNav?: boolean;
};

function LuxuryNavbarInner({ menu, showNav = true }: LuxuryNavbarProps) {
  const { active, go } = usePublicMenuNavigation(menu.qrId);
  const account = useCustomerAccountUi();
  const ordering = useOrderingOptional();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--lx-border)] bg-[color-mix(in_srgb,var(--lx-bg)_96%,transparent)] backdrop-blur-md">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {showNav ? (
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--lx-border)] lx-fg"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        ) : (
          <div className="h-10 w-10" />
        )}

        <button
          type="button"
          onClick={() => {
            if (showNav) go("landing");
          }}
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
        >
          <MenuBrandLogo logoUrl={menu.logoUrl} businessName={menu.businessName} size={28} className="shrink-0" />
          <span className="font-display text-base font-bold tracking-[0.06em] text-gradient-gold sm:text-lg">
            {menu.businessName.toUpperCase()}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <MenuLanguagePicker variant="dropdown" />
          {ordering ? (
            <button
              type="button"
              onClick={() => ordering.setCartOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--lx-border)] lx-fg"
              aria-label="Sepet"
            >
              <ShoppingBag className="h-4 w-4" />
              {ordering.cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-gold px-1 text-[10px] font-semibold text-[var(--lx-primary-fg)]">
                  {ordering.cartCount > 99 ? "99+" : ordering.cartCount}
                </span>
              ) : null}
            </button>
          ) : (
            <div className="h-10 w-10" />
          )}
        </div>

        {showNav ? (
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => go(item.key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] transition",
                  active === item.key
                    ? "bg-gradient-gold text-[var(--lx-primary-fg)]"
                    : "lx-muted hover:text-[var(--lx-fg)]",
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        ) : null}
      </div>

      {showNav && open ? (
        <div className="border-t border-[var(--lx-border)] px-4 py-3">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {account ? (
              account.profile ? (
                <button
                  type="button"
                  onClick={() => {
                    account.openAccount();
                    setOpen(false);
                  }}
                  className="mb-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium lx-fg hover:bg-[color-mix(in_oklch,var(--lx-gold)_12%,transparent)]"
                >
                  <UserRound className="h-4 w-4 lx-gold" />
                  Hesabım
                </button>
              ) : (
                <div className="mb-1 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      account.openAuth("login");
                      setOpen(false);
                    }}
                    className="rounded-xl bg-gradient-gold px-3 py-2.5 text-sm font-semibold text-[var(--lx-primary-fg)]"
                  >
                    Giriş yap
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      account.openAuth("register");
                      setOpen(false);
                    }}
                    className="rounded-xl border border-[var(--lx-border)] px-3 py-2.5 text-sm font-medium lx-fg hover:border-[color-mix(in_oklch,var(--lx-gold)_40%,transparent)]"
                  >
                    Kayıt ol
                  </button>
                </div>
              )
            ) : null}
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  go(item.key);
                  setOpen(false);
                }}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-left text-sm font-medium lg:hidden",
                  active === item.key
                    ? "bg-[color-mix(in_oklch,var(--lx-gold)_18%,transparent)] lx-gold"
                    : "lx-fg",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function LuxuryNavbar(props: LuxuryNavbarProps) {
  return (
    <Suspense fallback={null}>
      <LuxuryNavbarInner {...props} />
    </Suspense>
  );
}
