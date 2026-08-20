"use client";

import { formatMenuPrice } from "@/components/menu-templates/types";
import { QuantityStepper } from "@/components/waiter/quantity-stepper";
import { Button } from "@/components/ui/button";
import type { WaiterBillItem } from "@/lib/waiter-api";

export function BillItemRow({
  item,
  currency,
  busy,
  minQuantity,
  showDelete = false,
  onQuantityChange,
  onRemove,
  onPay,
}: {
  item: WaiterBillItem;
  currency: string;
  busy: boolean;
  minQuantity: number;
  showDelete?: boolean;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onPay: () => void;
}) {
  const paidQty = item.paidQuantity ?? 0;
  const unpaidQty = item.unpaidQuantity ?? Math.max(0, item.quantity - paidQty);
  const fullyPaid = unpaidQty <= 0;

  return (
    <li
      className={`flex flex-col gap-2 rounded-lg border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between ${
        fullyPaid ? "border-emerald-100 bg-emerald-50/60" : "border-zinc-100 bg-white"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-zinc-900">{item.productName}</p>
          {paidQty > 0 ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
              {paidQty} ödendi
            </span>
          ) : null}
        </div>
        <p className="text-xs text-zinc-500">
          {formatMenuPrice(item.unitPrice ?? undefined, currency)} / adet
          {unpaidQty > 0 && paidQty > 0 ? ` · ${unpaidQty} kalan` : null}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <QuantityStepper
          size="sm"
          value={item.quantity}
          min={minQuantity}
          disabled={busy}
          showDelete={showDelete}
          onChange={onQuantityChange}
          onRemove={onRemove}
        />
        <p className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums text-zinc-900">
          {formatMenuPrice(item.lineTotal ?? undefined, currency)}
        </p>
        {unpaidQty > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 border-zinc-200 text-zinc-800"
            disabled={busy}
            onClick={onPay}
          >
            Öde
          </Button>
        ) : null}
      </div>
    </li>
  );
}
