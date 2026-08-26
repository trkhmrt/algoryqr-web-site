"use client";

import { useState } from "react";
import { Menu, ShoppingBag, UserRound, X } from "lucide-react";

import type { MenuProfileApiItem } from "@/lib/api";
import { MenuLanguagePicker } from "../shared/MenuLanguagePicker";
import { useCustomerAccountUi } from "../shared/CustomerAccountMenu";
import { useMenuExperienceOptional } from "../shared/menu-experience";
import { useOrderingOptional } from "../shared/ordering-context";

type MaisonNoirNavbarProps = {
  menu: Pick<MenuProfileApiItem, "businessName" | "logoUrl">;
  onBrandClick?: () => void;
};

export function MaisonNoirNavbar({ menu, onBrandClick }: MaisonNoirNavbarProps) {
  const experience = useMenuExperienceOptional();
  const ordering = useOrderingOptional();
  const account = useCustomerAccountUi();
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-40">
      <header className="border-b border-[var(--mn-border)] bg-[var(--mn-bg)]/90 backdrop-blur-md">
        <div className="relative mx-auto flex h-14 max-w-xl items-center justify-between px-6 sm:px-8">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center text-[var(--mn-fg)]/80 transition-colors hover:text-[var(--mn-primary)]"
            aria-label={open ? "Kapat" : "Menü"}
          >
            {open ? <X className="h-4 w-4" strokeWidth={1.25} /> : <Menu className="h-4 w-4" strokeWidth={1.25} />}
          </button>

          <button
            type="button"
            onClick={() => {
              onBrandClick?.();
              experience?.backToLandingHub();
              setOpen(false);
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

      {open && account ? (
        <div className="border-b border-[var(--mn-border)] bg-[var(--mn-bg)]/90 px-6 py-4 backdrop-blur-md sm:px-8">
          <div className="mx-auto max-w-xl">
            {account.profile ? (
              <button
                type="button"
                onClick={() => {
                  account.openAccount();
                  setOpen(false);
                }}
                className="flex items-center gap-2 py-2 text-[0.65rem] text-[var(--mn-muted)] transition-colors hover:text-[var(--mn-primary)] mn-tracked"
              >
                <UserRound className="h-3 w-3" strokeWidth={1.25} />
                HESABIM
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    account.openAuth("login");
                    setOpen(false);
                  }}
                  className="border border-[var(--mn-primary)] px-4 py-2.5 text-[0.58rem] text-[var(--mn-primary)] transition-colors hover:bg-[var(--mn-primary)] hover:text-[var(--mn-primary-fg)] mn-tracked"
                >
                  GİRİŞ YAP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    account.openAuth("register");
                    setOpen(false);
                  }}
                  className="border border-[var(--mn-border)] px-4 py-2.5 text-[0.58rem] text-[var(--mn-muted)] transition-colors hover:border-[var(--mn-primary)] hover:text-[var(--mn-primary)] mn-tracked"
                >
                  KAYIT OL
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
