"use client";

import { ArrowRight } from "lucide-react";

import { useMenuPriceDisplay } from "../shared/menu-currency";
import { useOrderingOptional } from "../shared/ordering-context";

export function CleverDishScribeCartBar() {
  const ordering = useOrderingOptional();

  if (!ordering || ordering.cartCount <= 0) {
    return null;
  }

  const currency = ordering.localItems[0]?.currency ?? ordering.cart?.currency ?? "TRY";
  const totalLabel = useMenuPriceDisplay(ordering.cartTotal, currency);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={() => ordering.setCartOpen(true)}
        className="cds-cart-enter pointer-events-auto flex w-full max-w-lg items-center justify-between gap-3 rounded-2xl border border-[var(--cds-border)] bg-[var(--cds-surface-elevated)]/95 px-4 py-3.5 shadow-[var(--cds-shadow)] backdrop-blur-md transition-transform active:scale-[0.99]"
      >
        <span className="text-sm font-medium text-[var(--cds-muted)]">
          Sepetim • {ordering.cartCount} ürün
        </span>
        <span className="flex items-center gap-2 text-sm font-semibold text-[var(--cds-accent)]">
          {totalLabel}
          <ArrowRight className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
}
