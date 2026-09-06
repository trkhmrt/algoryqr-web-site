"use client";

import { ArrowRight, Bell } from "lucide-react";

import { useMenuPriceDisplay } from "../shared/menu-currency";
import { useMenuLocale } from "../shared/menu-locale";
import { useOrderingOptional } from "../shared/ordering-context";

type KahveCartTrayProps = {
  onCallWaiter?: () => void;
};

export function KahveCartTray({ onCallWaiter }: KahveCartTrayProps) {
  const ordering = useOrderingOptional();
  const { t } = useMenuLocale();
  const currency = ordering?.localItems[0]?.currency ?? ordering?.cart?.currency ?? "TRY";
  const totalLabel = useMenuPriceDisplay(ordering?.cartTotal ?? 0, currency);

  if (!ordering || ordering.cartCount <= 0) return null;

  return (
    <aside className="pointer-events-none fixed bottom-16 left-1/2 z-40 w-full max-w-[460px] -translate-x-1/2 px-3 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="pointer-events-auto flex items-center justify-between rounded-2xl border border-[color-mix(in_srgb,var(--ks-secondary)_40%,transparent)] bg-[color-mix(in_srgb,#241105_95%,transparent)] p-2.5 text-white shadow-2xl backdrop-blur-xl">
        <button
          type="button"
          onClick={() => ordering.setCartOpen(true)}
          className="flex min-w-0 items-center gap-2.5 pl-1 text-left"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--ks-secondary)] text-sm font-black text-white shadow-md">
            {ordering.cartCount > 99 ? "99+" : ordering.cartCount}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-[11px] font-bold text-amber-200">{t.myCart}</span>
            <span className="font-display text-sm font-black text-white">{totalLabel}</span>
          </span>
        </button>
        <div className="flex items-center gap-1.5">
          {onCallWaiter ? (
            <button
              type="button"
              onClick={onCallWaiter}
              className="flex h-9 items-center gap-1 rounded-xl bg-white/10 px-3 text-xs font-semibold text-stone-200 transition hover:bg-white/20 active:scale-95"
            >
              <Bell className="h-3.5 w-3.5" strokeWidth={2} />
              <span>Garson</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => ordering.setCartOpen(true)}
            className="flex h-9 items-center gap-1 rounded-xl bg-gradient-to-r from-[var(--ks-secondary-container)] to-[var(--ks-secondary)] px-3.5 text-xs font-bold text-white shadow-lg active:scale-95"
          >
            <span>{t.placeOrder}</span>
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </aside>
  );
}
