"use client";

import { useState } from "react";
import { Menu, ShoppingBag, UserRound, X } from "lucide-react";

import type { MenuProfileApiItem } from "@/lib/api";
import { MenuBrandLogo } from "../shared/MenuBrandLogo";
import { MenuLanguagePicker } from "../shared/MenuLanguagePicker";
import { useCustomerAccountUi } from "../shared/CustomerAccountMenu";
import { usePublicMenuNavigation } from "@/hooks/use-public-menu-navigation";
import { useOrderingOptional } from "../shared/ordering-context";

type CleverDishScribeNavbarProps = {
  menu: Pick<MenuProfileApiItem, "businessName" | "logoUrl" | "qrId">;
};

export function CleverDishScribeNavbar({ menu }: CleverDishScribeNavbarProps) {
  const { go } = usePublicMenuNavigation(menu.qrId);
  const ordering = useOrderingOptional();
  const account = useCustomerAccountUi();
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-40">
      <header className="border-b border-[var(--cds-border)] bg-[var(--cds-bg)]/92 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--cds-fg)] transition-colors hover:bg-[var(--cds-surface)]"
            aria-label={open ? "Kapat" : "Menü"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              go("landing");
              setOpen(false);
            }}
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

      {open && account ? (
        <div className="border-b border-[var(--cds-border)] bg-[var(--cds-bg)]/92 px-4 py-3 backdrop-blur-md">
          <div className="mx-auto max-w-6xl">
            {account.profile ? (
              <button
                type="button"
                onClick={() => {
                  account.openAccount();
                  setOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--cds-fg)] hover:bg-[var(--cds-surface)]"
              >
                <UserRound className="h-4 w-4" />
                Hesabım
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    account.openAuth("login");
                    setOpen(false);
                  }}
                  className="rounded-xl bg-[var(--cds-accent)] px-3 py-2.5 text-sm font-semibold text-[#052e16]"
                >
                  Giriş yap
                </button>
                <button
                  type="button"
                  onClick={() => {
                    account.openAuth("register");
                    setOpen(false);
                  }}
                  className="rounded-xl border border-[var(--cds-border)] px-3 py-2.5 text-sm font-medium text-[var(--cds-fg)]"
                >
                  Kayıt ol
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
