"use client";

import { formatMenuPrice } from "@/components/menu-templates/types";
import { paymentMethodLabel } from "@/components/waiter/bill/bill-utils";
import type { WaiterBillPayment } from "@/lib/waiter-api";

function formatWhen(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export function BillPaymentsList({
  payments,
  currency,
}: {
  payments: WaiterBillPayment[];
  currency: string;
}) {
  const visible = payments.filter((p) => !p.tip);

  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 border-t border-zinc-100 pt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Alınan ödemeler
      </p>
      <ul className="space-y-1.5">
        {visible.map((payment) => (
          <li
            key={payment.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-zinc-800">
                {payment.itemSummary ??
                  (payment.splitShareNumber && payment.splitPersonCount
                    ? `Pay ${payment.splitShareNumber}/${payment.splitPersonCount}`
                    : "Ödeme")}
              </p>
              <p className="text-xs text-zinc-500">
                {payment.paymentMethod
                  ? paymentMethodLabel(payment.paymentMethod)
                  : "—"}{" "}
                · {formatWhen(payment.paidAt)}
              </p>
            </div>
            <span className="shrink-0 font-semibold tabular-nums text-zinc-900">
              {formatMenuPrice(payment.amount ?? undefined, currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
