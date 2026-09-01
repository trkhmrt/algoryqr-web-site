"use client";

import { ArrowRight } from "lucide-react";

import { useMenuPriceDisplay } from "../shared/menu-currency";
import { useOrderingOptional } from "../shared/ordering-context";

export function ModernBistroCartBar() {
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
        className="pointer-events-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl bg-[var(--mb-primary)] px-4 py-3.5 text-[var(--mb-primary-fg)] shadow-[var(--mb-shadow)] transition-transform active:scale-[0.99]"
      >
        <span className="text-sm font-medium">
          Sepetim • {ordering.cartCount} ürün
        </span>
        <span className="flex items-center gap-2 text-sm font-semibold">
          {totalLabel}
          <ArrowRight className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
}
