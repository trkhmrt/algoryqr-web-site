"use client";

import { useCallback, useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatMenuPrice } from "../types";
import { useMenuLocaleOptional } from "./menu-locale";
import { OrderSuccessOverlay } from "./OrderSuccessOverlay";
import { useOrdering } from "./ordering-context";
import { usePublicMenuTheme } from "./public-menu-theme";

export function CartSheet() {
  const {
    cartOpen,
    setCartOpen,
    localItems,
    cartTotal,
    cart,
    note,
    setNote,
    updateQty,
    submitOrder,
    submitting,
    error,
    tableName,
  } = useOrdering();
  const locale = useMenuLocaleOptional();
  const t = locale?.t;
  const [successId, setSuccessId] = useState<number | null>(null);
  const theme = usePublicMenuTheme();
  const currency = cart?.currency || localItems[0]?.currency || "TRY";

  const dismissSuccess = useCallback(() => {
    setSuccessId(null);
  }, []);

  return (
    <>
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent
        side="right"
        className={`${theme.rootClassName} h-full w-[min(100%,24rem)] overflow-y-auto border-l border-[var(--lx-border)] bg-[var(--lx-bg)] p-0 text-[var(--lx-fg)]`}
        dir={locale?.dir}
      >
        <div className="space-y-4 px-4 pb-8 pt-4">
          <style>{theme.styles}</style>
          <SheetHeader className="text-left">
            <SheetTitle>{t?.cart || "Sepet"}</SheetTitle>
            <SheetDescription>
              {tableName ? `Masa: ${tableName}` : t?.cart || "Masa siparişi"}
            </SheetDescription>
          </SheetHeader>

          {localItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sepetiniz boş.</p>
          ) : (
            <ul className="space-y-3">
              {localItems.map((item) => (
                <li
                  key={item.productId}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatMenuPrice(item.unitPrice, currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border"
                      onClick={() => void updateQty(item.productId, item.quantity - 1)}
                      aria-label="Azalt"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border"
                      onClick={() => void updateQty(item.productId, item.quantity + 1)}
                      aria-label="Artır"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Not</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Örn. az pişmiş, sos ayrı"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Toplam</span>
            <span className="font-semibold">{formatMenuPrice(cartTotal, currency)}</span>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <button
            type="button"
            disabled={localItems.length === 0 || submitting}
            onClick={async () => {
              const order = await submitOrder();
              if (order?.id) {
                setSuccessId(order.id);
                setCartOpen(false);
              }
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-3 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t?.placeOrder || "Sipariş ver"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
    {successId != null ? (
      <OrderSuccessOverlay orderId={successId} onDone={dismissSuccess} />
    ) : null}
    </>
  );
}
