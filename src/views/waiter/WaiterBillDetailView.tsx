"use client";

import { useMemo, useState } from "react";
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
  payWaiterBillItems,
  removeWaiterBillItem,
  updateWaiterBillItemQuantity,
  WaiterApiError,
  type WaiterBill,
  type WaiterBillItem,
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

function unpaidQty(item: WaiterBillItem): number {
  return item.unpaidQuantity ?? Math.max(0, item.quantity - (item.paidQuantity ?? 0));
}

function splitPerPerson(total: number, count: number): { perPerson: number; remainder: number } {
  if (count <= 0 || total <= 0) return { perPerson: 0, remainder: 0 };
  const perPerson = Math.floor((total / count) * 100) / 100;
  const remainder = Math.round((total - perPerson * count) * 100) / 100;
  return { perPerson, remainder };
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
  const [confirmPayOpen, setConfirmPayOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | null>(null);
  const [tipReceived, setTipReceived] = useState(false);
  const [tipAmount, setTipAmount] = useState("");
  const [splitCount, setSplitCount] = useState(2);
  const [selectedItems, setSelectedItems] = useState<Record<number, number>>({});
  const [closeSuccess, setCloseSuccess] = useState<CloseSuccessSummary | null>(null);
  const hasOpenBill = table.billStatus === "OPEN" && table.openBillId != null;

  const billQuery = useQuery({
    queryKey: ["waiter-open-bill", table.tableId],
    queryFn: () => getWaiterOpenBill(table.tableId),
    enabled: hasOpenBill,
    refetchInterval: 6_000,
  });

  const invalidateBillQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["waiter-open-bill", table.tableId] }),
      queryClient.invalidateQueries({ queryKey: ["waiter-orders-tables"] }),
      queryClient.invalidateQueries({ queryKey: ["waiter-orders-today"] }),
      queryClient.invalidateQueries({ queryKey: ["waiter-table-today", table.tableId] }),
      queryClient.invalidateQueries({ queryKey: ["waiter-commissions-today"] }),
      queryClient.invalidateQueries({ queryKey: ["waiter-commissions-history"] }),
    ]);
  };

  const itemMutation = useMutation({
    mutationFn: async (payload: { billId: number; itemId: number; quantity: number }) => {
      if (payload.quantity <= 0) {
        return removeWaiterBillItem(payload.billId, payload.itemId);
      }
      return updateWaiterBillItemQuantity(payload.billId, payload.itemId, payload.quantity);
    },
    onSuccess: invalidateBillQueries,
  });

  const payMutation = useMutation({
    mutationFn: (payload: {
      billId: number;
      paymentMethod: "CASH" | "CARD";
      items: { itemId: number; quantityToPay: number }[];
      tipReceived?: boolean;
      tipAmount?: number;
    }) =>
      payWaiterBillItems(payload.billId, {
        paymentMethod: payload.paymentMethod,
        items: payload.items,
        tipReceived: payload.tipReceived,
        tipAmount: payload.tipAmount,
      }),
    onSuccess: async (bill: WaiterBill, variables) => {
      await invalidateBillQueries();
      setConfirmPayOpen(false);
      setPaymentMethod(null);
      setSelectedItems({});
      if (bill.status === "CLOSED") {
        setCloseSuccess({
          total: formatMenuPrice(bill.totalAmount ?? undefined, bill.currency || "TRY"),
          paymentMethod: variables.paymentMethod,
        });
      }
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
    onSuccess: async (bill: WaiterBill, variables) => {
      await invalidateBillQueries();
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
  const busy = itemMutation.isPending || closeMutation.isPending || payMutation.isPending;
  const totalLabel = formatMenuPrice(bill?.totalAmount ?? undefined, currency);
  const remainingNumeric = Number(bill?.remainingTotal ?? bill?.totalAmount ?? 0);
  const remainingLabel = formatMenuPrice(
    bill?.remainingTotal ?? bill?.totalAmount ?? undefined,
    currency,
  );
  const paidLabel = formatMenuPrice(bill?.paidTotal ?? 0, currency);
  const split = splitPerPerson(
    Number.isFinite(remainingNumeric) ? remainingNumeric : 0,
    splitCount,
  );
  const splitLabel = formatMenuPrice(split.perPerson, currency);

  const payLines = useMemo(
    () =>
      Object.entries(selectedItems)
        .map(([itemId, qty]) => ({ itemId: Number(itemId), quantityToPay: qty }))
        .filter((line) => line.quantityToPay > 0),
    [selectedItems],
  );

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

  function toggleItemSelection(item: WaiterBillItem, checked: boolean) {
    const remaining = unpaidQty(item);
    if (remaining <= 0) return;
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (checked) {
        next[item.id] = remaining;
      } else {
        delete next[item.id];
      }
      return next;
    });
  }

  function setPayQty(item: WaiterBillItem, qty: number) {
    const remaining = unpaidQty(item);
    const safe = Math.max(0, Math.min(qty, remaining));
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (safe <= 0) delete next[item.id];
      else next[item.id] = safe;
      return next;
    });
  }

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

        <div className="grid grid-cols-3 gap-2 rounded-md bg-muted/30 p-2 text-center text-xs">
          <div>
            <p className="text-muted-foreground">Toplam</p>
            <p className="font-semibold tabular-nums">{totalLabel}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ödenen</p>
            <p className="font-semibold tabular-nums text-emerald-600">{paidLabel}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Kalan</p>
            <p className="font-semibold tabular-nums text-orange-600">{remainingLabel}</p>
          </div>
        </div>

        {itemMutation.isError ? (
          <p className="text-sm text-destructive">
            {itemMutation.error instanceof WaiterApiError
              ? itemMutation.error.message
              : "Kalem güncellenemedi."}
          </p>
        ) : null}

        {payMutation.isError ? (
          <p className="text-sm text-destructive">
            {payMutation.error instanceof WaiterApiError
              ? payMutation.error.message
              : "Ödeme alınamadı."}
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
            items.map((item) => {
              const remaining = unpaidQty(item);
              const paid = item.paidQuantity ?? 0;
              const isSelected = selectedItems[item.id] != null;
              return (
                <li
                  key={item.id}
                  className="space-y-2 rounded-md bg-muted/30 px-2 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex min-w-0 flex-1 items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1"
                        disabled={busy || remaining <= 0}
                        checked={isSelected}
                        onChange={(e) => toggleItemSelection(item, e.target.checked)}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatMenuPrice(item.unitPrice ?? undefined, currency)} / adet
                        </p>
                        <p className="text-xs">
                          <span className="text-emerald-600">Ödenen: {paid}</span>
                          {" · "}
                          <span className="text-orange-600">Kalan: {remaining}</span>
                        </p>
                      </div>
                    </label>
                    <QuantityStepper
                      size="sm"
                      value={item.quantity}
                      disabled={busy || paid > 0}
                      showDelete={paid <= 0}
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
                  </div>
                  {isSelected && remaining > 0 ? (
                    <div className="flex items-center justify-between pl-6 text-xs">
                      <span className="text-muted-foreground">Ödenecek adet</span>
                      <QuantityStepper
                        size="sm"
                        value={selectedItems[item.id] ?? remaining}
                        min={1}
                        max={remaining}
                        disabled={busy}
                        onChange={(qty) => setPayQty(item, qty)}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })
          )}
        </ul>

        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={onAddProducts}>
            Ürün ekle
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || payLines.length === 0}
            onClick={() => {
              setPaymentMethod(null);
              setConfirmPayOpen(true);
            }}
          >
            Seçili kalemleri öde
          </Button>
          <Button
            type="button"
            className="col-span-2"
            disabled={busy}
            onClick={() => {
              setPaymentMethod(null);
              setSplitCount(2);
              setConfirmCloseOpen(true);
            }}
          >
            {closeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Masayı kapat"}
          </Button>
        </div>
      </section>

      <AlertDialog
        open={confirmPayOpen}
        onOpenChange={(open) => {
          setConfirmPayOpen(open);
          if (!open) setPaymentMethod(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kısmi ödeme al</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>{payLines.length} kalem için ödeme alınacak.</p>
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
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={payMutation.isPending}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              disabled={payMutation.isPending || paymentMethod == null || payLines.length === 0}
              onClick={(event) => {
                event.preventDefault();
                if (paymentMethod == null) return;
                payMutation.mutate({
                  billId: bill!.id,
                  paymentMethod,
                  items: payLines,
                });
              }}
            >
              {payMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Ödemeyi al
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  kalan tutarı tahsil edilecek.
                </p>
                <p>
                  Kalan tutar:{" "}
                  <span className="font-semibold text-foreground">{remainingLabel}</span>
                </p>
                <div className="space-y-2 rounded-md border border-border p-3">
                  <p className="text-xs font-medium text-foreground">Hesap bölme (bilgi)</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs">Kişi sayısı</span>
                    <QuantityStepper
                      size="sm"
                      value={splitCount}
                      min={2}
                      max={20}
                      disabled={busy}
                      onChange={setSplitCount}
                    />
                  </div>
                  <p className="text-xs">
                    Kişi başı:{" "}
                    <span className="font-semibold text-foreground">{splitLabel}</span>
                    {split.remainder > 0 ? (
                      <span className="text-muted-foreground">
                        {" "}
                        (son kişi +{formatMenuPrice(split.remainder, currency)})
                      </span>
                    ) : null}
                  </p>
                </div>
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
