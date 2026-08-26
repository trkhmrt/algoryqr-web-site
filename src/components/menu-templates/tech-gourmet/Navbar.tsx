"use client";

import { useState } from "react";
import { Menu, ShoppingBag, UserRound, X } from "lucide-react";

import type { MenuProfileApiItem } from "@/lib/api";
import { MenuBrandLogo } from "../shared/MenuBrandLogo";
import { MenuLanguagePicker } from "../shared/MenuLanguagePicker";
import { useCustomerAccountUi } from "../shared/CustomerAccountMenu";
import { useMenuExperienceOptional } from "../shared/menu-experience";
import { useOrderingOptional } from "../shared/ordering-context";

type TechGourmetNavbarProps = {
  menu: Pick<MenuProfileApiItem, "businessName" | "logoUrl">;
};

export function TechGourmetNavbar({ menu }: TechGourmetNavbarProps) {
  const experience = useMenuExperienceOptional();
  const ordering = useOrderingOptional();
  const account = useCustomerAccountUi();
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-40">
      <header
        className="flex h-16 items-center justify-between px-4 sm:px-6"
        style={{
          backgroundColor: "var(--tg-bg)",
          borderBottom: "1px solid var(--tg-outline-variant)",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center transition-colors"
          style={{ color: "var(--tg-fg-variant)" }}
          aria-label={open ? "Kapat" : "Menü"}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        <button
          type="button"
          onClick={() => {
            experience?.backToLandingHub();
            setOpen(false);
          }}
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

      {open && account ? (
        <div
          className="px-4 py-3"
          style={{
            backgroundColor: "var(--tg-bg)",
            borderBottom: "1px solid var(--tg-outline-variant)",
          }}
        >
          <div className="mx-auto max-w-6xl">
            {account.profile ? (
              <button
                type="button"
                onClick={() => {
                  account.openAccount();
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2.5 text-sm transition-colors"
                style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-fg-variant)", letterSpacing: "0.04em" }}
              >
                <UserRound size={14} />
                HESABIM
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    account.openAuth("login");
                    setOpen(false);
                  }}
                  className="px-3 py-2.5 text-xs font-semibold transition-colors"
                  style={{
                    fontFamily: "var(--tg-font-mono)",
                    letterSpacing: "0.06em",
                    backgroundColor: "var(--tg-primary)",
                    color: "var(--tg-on-primary)",
                  }}
                >
                  GİRİŞ YAP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    account.openAuth("register");
                    setOpen(false);
                  }}
                  className="px-3 py-2.5 text-xs transition-colors"
                  style={{
                    fontFamily: "var(--tg-font-mono)",
                    letterSpacing: "0.06em",
                    border: "1px solid var(--tg-outline-variant)",
                    color: "var(--tg-fg-variant)",
                  }}
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
