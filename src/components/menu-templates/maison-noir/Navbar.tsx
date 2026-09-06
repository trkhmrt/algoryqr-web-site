"use client";



import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AnimatePresence, motion } from "framer-motion";

import { ChevronDown, Menu, ShoppingBag, UserRound, X } from "lucide-react";



import type { MenuProfileApiItem } from "@/lib/api";

import { cn } from "@/lib/utils";

import { MenuLanguagePicker } from "../shared/MenuLanguagePicker";
import { useMenuLocale } from "../shared/menu-locale";

import { useCustomerAccountUi } from "../shared/CustomerAccountMenu";

import { usePublicMenuNavigation } from "@/hooks/use-public-menu-navigation";
import { publicMenuContentPath } from "@/lib/public-menu-paths";

import { useOrderingOptional } from "../shared/ordering-context";



import { MaisonNoirChefNavButton } from "./ChefNavButton";



type MaisonNoirNavbarProps = {

  menu: Pick<

    MenuProfileApiItem,

    | "businessName"

    | "logoUrl"

    | "qrId"

    | "publicId"

    | "chefName"

    | "chefDisplayName"

    | "chefAvatarUrl"

  >;

  onBrandClick?: () => void;

};



type DrawerSection = "account" | null;



export function MaisonNoirNavbar({ menu, onBrandClick }: MaisonNoirNavbarProps) {
  const pathname = usePathname();
  const { go } = usePublicMenuNavigation(menu.publicId ?? "");
  const contentPath = publicMenuContentPath(menu.publicId ?? "");

  const ordering = useOrderingOptional();
  const { t } = useMenuLocale();

  const account = useCustomerAccountUi();

  const [open, setOpen] = useState(false);

  const [expanded, setExpanded] = useState<DrawerSection>(null);



  const closeDrawer = useCallback(() => {
    setExpanded(null);
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {

      if (event.key === "Escape") closeDrawer();

    };

    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", onKeyDown);

    return () => {

      document.body.style.overflow = "";

      document.removeEventListener("keydown", onKeyDown);

    };

  }, [closeDrawer, open]);



  const toggleSection = (section: DrawerSection) => {

    setExpanded((current) => (current === section ? null : section));

  };



  return (

    <>

      <div className="sticky top-0 z-40">

        <header className="mn-glass-nav sticky top-0 z-40 border-b">
          <div className="relative mx-auto flex h-12 max-w-xl items-center justify-between px-4 sm:px-6">
            <div className="relative z-10 min-w-0 shrink-0">
              <MaisonNoirChefNavButton
                publicId={menu.publicId ?? ""}
                chefName={menu.chefName}
                chefDisplayName={menu.chefDisplayName}
                chefAvatarUrl={menu.chefAvatarUrl}
              />
            </div>

            <Link
              href={contentPath}
              onClick={(event) => {
                onBrandClick?.();
                closeDrawer();
                if (pathname === contentPath) {
                  event.preventDefault();
                  go("landing");
                }
              }}
              className="pointer-events-auto absolute left-1/2 top-1/2 z-20 max-w-[min(52vw,12rem)] -translate-x-1/2 -translate-y-1/2 truncate text-center mn-type-brand text-[var(--mn-fg)] transition-colors hover:text-[var(--mn-primary)]"
            >
              {menu.businessName}
            </Link>

            <div className="relative z-10 flex shrink-0 items-center justify-end gap-0.5">

              <MenuLanguagePicker variant="minimal" />

              <button

                type="button"

                onClick={() => {
                  if (open) {
                    closeDrawer();
                    return;
                  }
                  setOpen(true);
                }}

                className="flex h-9 w-9 items-center justify-center text-[var(--mn-fg)] transition-colors hover:text-[var(--mn-primary)]"

                aria-label={open ? t.closeMenu : t.openMenu}

                aria-expanded={open}

              >

                {open ? <X className="h-4 w-4" strokeWidth={1.25} /> : <Menu className="h-4 w-4" strokeWidth={1.25} />}

              </button>

            </div>

          </div>

        </header>

      </div>



      <AnimatePresence>

        {open ? (

          <>

            <motion.button

              type="button"

              initial={{ opacity: 0 }}

              animate={{ opacity: 1 }}

              exit={{ opacity: 0 }}

              transition={{ duration: 0.22 }}

              className="fixed inset-0 z-[45] bg-[var(--mn-bg)]/55 backdrop-blur-[2px]"

              aria-label={t.closeMenu}

              onClick={closeDrawer}

            />

            <motion.nav

              initial={{ y: "-100%", opacity: 0.6 }}

              animate={{ y: 0, opacity: 1 }}

              exit={{ y: "-100%", opacity: 0 }}

              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}

              className="mn-nav-drawer fixed inset-x-0 top-12 z-[46] mx-auto flex max-h-[50dvh] max-w-xl flex-col overflow-hidden border-b border-[var(--mn-border)]/40 shadow-[var(--mn-shadow)]"

              aria-label={t.menuPanel}

            >

              <div className="mn-glass-nav shrink-0 border-b border-[var(--mn-border)]/25 px-5 py-2.5 sm:px-7">

                <p className="mn-type-eyebrow text-[var(--mn-muted)]">{t.menuPanel}</p>

              </div>



              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-1 sm:px-7">

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

                  <div className="border-b border-[var(--mn-border)]/25">

                    <button

                      type="button"

                      onClick={() => toggleSection("account")}

                      className="flex w-full items-center justify-between gap-3 py-3.5 text-left transition-colors hover:text-[var(--mn-primary)]"

                    >

                      <span className="flex items-center gap-2.5">

                        <UserRound className="h-3.5 w-3.5 shrink-0" strokeWidth={1.25} />

                        <span className="mn-type-label text-[var(--mn-fg)]">

                          {t.account}

                        </span>

                      </span>

                      <ChevronDown

                        className={cn(

                          "h-3 w-3 text-[var(--mn-muted)] transition-transform duration-300",

                          expanded === "account" && "rotate-180",

                        )}

                        strokeWidth={1.25}

                      />

                    </button>



                    <AnimatePresence initial={false}>

                      {expanded === "account" ? (

                        <motion.div

                          initial={{ height: 0, opacity: 0 }}

                          animate={{ height: "auto", opacity: 1 }}

                          exit={{ height: 0, opacity: 0 }}

                          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}

                          className="overflow-hidden"

                        >

                          <div className="pb-3 pt-0.5">

                            {account.profile ? (

                              <button

                                type="button"

                                onClick={() => {

                                  account.openAccount();

                                  closeDrawer();

                                }}

                                className="mn-type-eyebrow w-full border border-[var(--mn-border)] px-3 py-2.5 text-[var(--mn-fg)] transition-colors hover:border-[var(--mn-primary)] hover:text-[var(--mn-primary)]"

                              >

                                {t.account}

                              </button>

                            ) : (

                              <div className="grid grid-cols-2 gap-2">

                                <button

                                  type="button"

                                  onClick={() => {

                                    account.openAuth("login");

                                    closeDrawer();

                                  }}

                                  className="mn-type-eyebrow border border-[var(--mn-primary)] px-3 py-2.5 text-[var(--mn-primary)] transition-colors hover:bg-[var(--mn-primary)] hover:text-[var(--mn-primary-fg)]"

                                >

                                  {t.login}

                                </button>

                                <button

                                  type="button"

                                  onClick={() => {

                                    account.openAuth("register");

                                    closeDrawer();

                                  }}

                                  className="mn-type-eyebrow border border-[var(--mn-border)] px-3 py-2.5 text-[var(--mn-fg)] transition-colors hover:border-[var(--mn-primary)] hover:text-[var(--mn-primary)]"

                                >

                                  {t.register}

                                </button>

                              </div>

                            )}

                          </div>

                        </motion.div>

                      ) : null}

                    </AnimatePresence>

                  </div>

                ) : null}

              </div>

            </motion.nav>

          </>

        ) : null}

      </AnimatePresence>

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

      className="flex w-full items-center justify-between gap-3 border-b border-[var(--mn-border)]/25 py-3.5 text-left transition-colors hover:text-[var(--mn-primary)]"

    >

      <span className="flex items-center gap-2.5">

        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.25} />

        <span className="mn-type-label text-[var(--mn-fg)]">{label}</span>

      </span>

      {badge != null && badge > 0 ? (

        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--mn-primary)] px-1 text-[9px] font-medium text-[var(--mn-primary-fg)]">

          {badge > 99 ? "99+" : badge}

        </span>

      ) : null}

    </button>

  );

}


