"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";

import { formatMenuPrice } from "@/components/menu-templates/types";
import { QuantityStepper } from "@/components/waiter/quantity-stepper";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  closeWaiterBill,
  getWaiterOpenBill,
  removeWaiterBillItem,
  updateWaiterBillItemQuantity,
  WaiterApiError,
  type WaiterBill,
  type WaiterTableSummary,
} from "@/lib/waiter-api";

function tableLabel(table: WaiterTableSummary): string {
  return table.tableName || `Masa ${table.tableNumber ?? table.tableId}`;
}

type CloseSuccessSummary = {
  total: string;
  paymentMethod: "CASH" | "CARD";
};

function paymentMethodLabel(method: "CASH" | "CARD"): string {
  return method === "CARD" ? "Kredi kartı" : "Nakit";
}

export default function WaiterBillDetailView({
  table,
  onAddProducts,
  onClosed,
}: {
  table: WaiterTableSummary;
  onAddProducts: () => void;
  onClosed: () => void;
}) {
  const queryClient = useQueryClient();
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | null>(null);
  const [tipReceived, setTipReceived] = useState(false);
  const [tipAmount, setTipAmount] = useState("");
  const [closeSuccess, setCloseSuccess] = useState<CloseSuccessSummary | null>(null);
  const hasOpenBill = table.billStatus === "OPEN" && table.openBillId != null;

  const billQuery = useQuery({
    queryKey: ["waiter-open-bill", table.tableId],
    queryFn: () => getWaiterOpenBill(table.tableId),
    enabled: hasOpenBill,
    refetchInterval: 6_000,
  });

  const itemMutation = useMutation({
    mutationFn: async (payload: { billId: number; itemId: number; quantity: number }) => {
      if (payload.quantity <= 0) {
        return removeWaiterBillItem(payload.billId, payload.itemId);
      }
      return updateWaiterBillItemQuantity(payload.billId, payload.itemId, payload.quantity);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["waiter-open-bill", table.tableId] }),
        queryClient.invalidateQueries({ queryKey: ["waiter-orders-tables"] }),
      ]);
    },
  });

  const closeMutation = useMutation({
    mutationFn: (payload: {
      billId: number;
      paymentMethod: "CASH" | "CARD";
      tipReceived?: boolean;
      tipAmount?: number;
    }) =>
      closeWaiterBill(payload.billId, {
        paymentMethod: payload.paymentMethod,
        tipReceived: payload.tipReceived,
        tipAmount: payload.tipAmount,
      }),
    onSuccess: (bill: WaiterBill, variables) => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["waiter-open-bill", table.tableId] }),
        queryClient.invalidateQueries({ queryKey: ["waiter-orders-tables"] }),
        queryClient.invalidateQueries({ queryKey: ["waiter-orders-today"] }),
        queryClient.invalidateQueries({ queryKey: ["waiter-table-today", table.tableId] }),
        queryClient.invalidateQueries({ queryKey: ["waiter-commissions-today"] }),
        queryClient.invalidateQueries({ queryKey: ["waiter-commissions-history"] }),
      ]);
      setConfirmCloseOpen(false);
      setPaymentMethod(null);
      setTipReceived(false);
      setTipAmount("");
      setCloseSuccess({
        total: formatMenuPrice(bill.totalAmount ?? undefined, bill.currency || "TRY"),
        paymentMethod: variables.paymentMethod,
      });
    },
  });

  const bill = billQuery.data;
  const currency = bill?.currency || "TRY";
  const busy = itemMutation.isPending || closeMutation.isPending;
  const totalLabel = formatMenuPrice(bill?.totalAmount ?? undefined, currency);

  if (!hasOpenBill) {
    return (
      <section className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">Bu masada açık adisyon yok.</p>
        <Button type="button" className="mt-4 gap-1.5" onClick={onAddProducts}>
          <Plus className="h-4 w-4" />
          Sipariş oluştur
        </Button>
      </section>
    );
  }

  if (billQuery.isLoading) {
    return (
      <div className="flex justify-center py-10 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (billQuery.isError) {
    return (
      <p className="text-sm text-destructive">
        {billQuery.error instanceof WaiterApiError
          ? billQuery.error.message
          : "Adisyon yüklenemedi."}
      </p>
    );
  }

  const items = bill?.items ?? [];

  return (
    <>
      <section className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Açık adisyon</h3>
            <p className="text-xs text-muted-foreground">{tableLabel(table)} · #{bill?.id}</p>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Açık
          </span>
        </div>

        {itemMutation.isError ? (
          <p className="text-sm text-destructive">
            {itemMutation.error instanceof WaiterApiError
              ? itemMutation.error.message
              : "Kalem güncellenemedi."}
          </p>
        ) : null}

        {closeMutation.isError ? (
          <p className="text-sm text-destructive">
            {closeMutation.error instanceof WaiterApiError
              ? closeMutation.error.message
              : "Masa kapatılamadı."}
          </p>
        ) : null}

        <ul className="space-y-2 border-t border-border pt-3">
          {items.length === 0 ? (
            <li className="text-sm text-muted-foreground">Henüz kalem yok.</li>
          ) : (
            items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-md bg-muted/30 px-2 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatMenuPrice(item.unitPrice ?? undefined, currency)} / adet
                  </p>
                </div>
                <QuantityStepper
                  size="sm"
                  value={item.quantity}
                  disabled={busy}
                  showDelete
                  onChange={(quantity) =>
                    itemMutation.mutate({
                      billId: bill!.id,
                      itemId: item.id,
                      quantity,
                    })
                  }
                  onRemove={() =>
                    itemMutation.mutate({
                      billId: bill!.id,
                      itemId: item.id,
                      quantity: 0,
                    })
                  }
                />
                <p className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums">
                  {formatMenuPrice(item.lineTotal ?? undefined, currency)}
                </p>
              </li>
            ))
          )}
        </ul>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">Toplam</span>
          <span className="text-lg font-semibold tabular-nums">{totalLabel}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={onAddProducts}>
            Ürün ekle
          </Button>
          <Button type="button" disabled={busy} onClick={() => {
            setPaymentMethod(null);
            setConfirmCloseOpen(true);
          }}>
            {closeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Masayı kapat"}
          </Button>
        </div>
      </section>

      <AlertDialog
        open={confirmCloseOpen}
        onOpenChange={(open) => {
          setConfirmCloseOpen(open);
          if (!open) {
            setPaymentMethod(null);
            setTipReceived(false);
            setTipAmount("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Masa kapatılsın mı?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">{tableLabel(table)}</span> masasının
                  adisyonu kapatılacak.
                </p>
                <p>
                  Toplam tutar:{" "}
                  <span className="font-semibold text-foreground">{totalLabel}</span>
                </p>
                {items.length > 0 ? (
                  <p>{items.length} kalem adisyona dahil edilecek.</p>
                ) : (
                  <p>Adisyonda ürün bulunmuyor.</p>
                )}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">Ödeme yöntemi</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={`rounded-md border px-3 py-2 text-sm ${
                        paymentMethod === "CASH"
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted-foreground"
                      }`}
                      onClick={() => setPaymentMethod("CASH")}
                    >
                      Nakit
                    </button>
                    <button
                      type="button"
                      className={`rounded-md border px-3 py-2 text-sm ${
                        paymentMethod === "CARD"
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted-foreground"
                      }`}
                      onClick={() => setPaymentMethod("CARD")}
                    >
                      Kredi kartı
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={tipReceived}
                      onChange={(e) => setTipReceived(e.target.checked)}
                    />
                    Bahşiş alındı
                  </label>
                  {tipReceived ? (
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Bahşiş tutarı"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                    />
                  ) : null}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closeMutation.isPending}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              disabled={closeMutation.isPending || paymentMethod == null}
              onClick={(event) => {
                event.preventDefault();
                if (paymentMethod == null) return;
                const parsedTip = Number(tipAmount.replace(",", "."));
                if (tipReceived && (!Number.isFinite(parsedTip) || parsedTip < 0.01)) {
                  return;
                }
                closeMutation.mutate({
                  billId: bill!.id,
                  paymentMethod,
                  tipReceived: tipReceived || undefined,
                  tipAmount: tipReceived ? parsedTip : undefined,
                });
              }}
            >
              {closeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Masayı kapat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={closeSuccess != null}
        onOpenChange={(open) => {
          if (!open) {
            setCloseSuccess(null);
            onClosed();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Masa kapatıldı</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Toplam:{" "}
                  <span className="font-semibold text-foreground">{closeSuccess?.total}</span>
                </p>
                {closeSuccess?.paymentMethod ? (
                  <p>
                    Ödeme:{" "}
                    <span className="font-semibold text-foreground">
                      {paymentMethodLabel(closeSuccess.paymentMethod)}
                    </span>
                  </p>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Tamam</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
