"use client";

import { ShoppingBag } from "lucide-react";

import { CartSheet } from "./CartSheet";
import { useMenuLocaleOptional } from "./menu-locale";
import { useOrderingOptional } from "./ordering-context";

export function CartFab() {
  const ordering = useOrderingOptional();
  const locale = useMenuLocaleOptional();
  if (!ordering) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => ordering.setCartOpen(true)}
        className="fixed bottom-5 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full border border-border bg-foreground text-background shadow-lg"
        aria-label={locale?.t.cart || "Sepet"}
      >
        <ShoppingBag className="h-5 w-5" />
        {ordering.cartCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {ordering.cartCount > 99 ? "99+" : ordering.cartCount}
          </span>
        ) : null}
      </button>
      <CartSheet />
    </>
  );
}
