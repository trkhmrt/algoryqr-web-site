"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

import type { MenuProductApiItem } from "@/lib/api";

import { useMenuLocaleOptional } from "./menu-locale";
import { useOrderingOptional } from "./ordering-context";

type AddToOrderButtonProps = {
  product: MenuProductApiItem;
  className?: string;
};

export function AddToOrderButton({ product, className }: AddToOrderButtonProps) {
  const ordering = useOrderingOptional();
  const locale = useMenuLocaleOptional();
  const [busy, setBusy] = useState(false);

  if (!ordering) return null;

  const disabled = busy || ordering.loading;

  return (
    <div className={className ?? "mt-3"}>
      <button
        type="button"
        disabled={disabled}
        onClick={async () => {
          setBusy(true);
          try {
            await ordering.addProduct(product, 1);
            ordering.setCartOpen(true);
          } finally {
            setBusy(false);
          }
        }}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-foreground px-3 py-2.5 text-sm font-medium text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {locale?.t.addToOrder || "Siparişe ekle"}
      </button>
      {ordering.error ? (
        <p className="mt-1.5 text-xs text-destructive">{ordering.error}</p>
      ) : null}
    </div>
  );
}
