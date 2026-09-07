"use client";

import { useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, ShoppingBag, UserRound, X } from "lucide-react";

import type { MenuProfileApiItem } from "@/lib/api";
import { MenuLanguagePicker } from "../shared/MenuLanguagePicker";
import { useCustomerAccountUi } from "../shared/CustomerAccountMenu";
import { useMenuLocale } from "../shared/menu-locale";
import { useOrderingOptional } from "../shared/ordering-context";
import { MaisonNoirChefNavButton } from "../maison-noir/ChefNavButton";

type ModernBistroNavbarProps = {
  menu: Pick<
    MenuProfileApiItem,
    "publicId" | "chefName" | "chefDisplayName" | "chefAvatarUrl"
  >;
};

export function ModernBistroNavbar({ menu }: ModernBistroNavbarProps) {
  const ordering = useOrderingOptional();
  const account = useCustomerAccountUi();
  const { t } = useMenuLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const closeDrawer = () => setOpen(false);

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-12 z-30 bg-black/15"
            aria-label={t.closeMenu}
            onClick={closeDrawer}
          />
        ) : null}
      </AnimatePresence>

      <div className="sticky top-0 z-40">
        <header className="mb-solid-nav border-b">
          <div className="relative flex h-12 items-center justify-between px-4 sm:px-6">
            <div className="relative z-10 min-w-0 shrink-0">
              <MaisonNoirChefNavButton
                publicId={menu.publicId ?? ""}
                chefName={menu.chefName}
                chefDisplayName={menu.chefDisplayName}
                chefAvatarUrl={menu.chefAvatarUrl}
              />
            </div>

            <div className="relative z-10 flex shrink-0 items-center justify-end gap-0.5">
              <MenuLanguagePicker variant="minimal" />
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--mb-fg)] transition-colors hover:bg-[var(--mb-muted-surface)]"
                aria-label={open ? t.closeMenu : t.openMenu}
                aria-expanded={open}
              >
                {open ? (
                  <X className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <Menu className="h-4 w-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
          </div>
        </header>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-b border-[var(--mb-border)] bg-[var(--mb-surface)]"
              aria-label={t.menuPanel}
            >
              <div className="space-y-1 px-4 py-3 sm:px-6">
                {ordering ? (
                  <DrawerRow
                    icon={ShoppingBag}
                    label={t.cart}
                    badge={ordering.cartCount > 0 ? ordering.cartCount : undefined}
                    onClick={() => {
                      ordering.setCartOpen(true);
                      closeDrawer();
                    }}
                  />
                ) : null}

                {account ? (
                  account.profile ? (
                    <DrawerRow
                      icon={UserRound}
                      label={t.account}
                      onClick={() => {
                        account.openAccount();
                        closeDrawer();
                      }}
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          account.openAuth("login");
                          closeDrawer();
                        }}
                        className="rounded-xl border border-[var(--mb-primary)] px-3 py-2.5 text-sm font-semibold text-[var(--mb-primary)] transition-colors hover:bg-[var(--mb-primary)] hover:text-[var(--mb-primary-fg)]"
                      >
                        {t.login}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          account.openAuth("register");
                          closeDrawer();
                        }}
                        className="rounded-xl border border-[var(--mb-border)] px-3 py-2.5 text-sm font-semibold text-[var(--mb-fg)] transition-colors hover:bg-[var(--mb-muted-surface)]"
                      >
                        {t.register}
                      </button>
                    </div>
                  )
                ) : null}
              </div>
            </motion.nav>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  );
}

function DrawerRow({
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  icon: typeof ShoppingBag;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[var(--mb-muted-surface)]"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--mb-muted-surface)] text-[var(--mb-fg)]">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <span className="text-sm font-semibold text-[var(--mb-fg)]">{label}</span>
      </span>
      {badge != null && badge > 0 ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--mb-primary)] px-1.5 text-[10px] font-semibold text-[var(--mb-primary-fg)]">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </button>
  );
}
