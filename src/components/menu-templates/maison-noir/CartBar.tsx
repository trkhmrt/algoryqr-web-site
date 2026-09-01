"use client";

import { ArrowRight } from "lucide-react";

import { useMenuPriceDisplay } from "../shared/menu-currency";
import { useMenuLocale } from "../shared/menu-locale";
import { useOrderingOptional } from "../shared/ordering-context";

export function MaisonNoirCartBar() {
  const ordering = useOrderingOptional();
  const { t } = useMenuLocale();

  if (!ordering || ordering.cartCount <= 0) {
    return null;
  }

  const totalLabel = useMenuPriceDisplay(
    ordering.cartTotal,
    ordering.localItems[0]?.currency ?? ordering.cart?.currency ?? "TRY",
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={() => ordering.setCartOpen(true)}
        className="pointer-events-auto flex w-full max-w-xl items-center justify-between gap-3 border border-[var(--mn-primary)]/60 bg-[var(--mn-bg)] px-5 py-4 text-[var(--mn-fg)] shadow-[var(--mn-shadow)] transition-colors hover:bg-[var(--mn-primary)] hover:text-[var(--mn-primary-fg)]"
      >
        <span className="mn-tracked text-[0.58rem]">
          {t.cart} · {ordering.cartCount}
        </span>
        <span className="flex items-center gap-2 font-display text-lg">
          {totalLabel}
          <ArrowRight className="h-4 w-4" strokeWidth={1.25} />
        </span>
      </button>
    </div>
  );
}
