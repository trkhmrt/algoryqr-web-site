"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";

import { formatMenuPrice } from "@/components/menu-templates/types";
import { BillCloseDialog } from "@/components/waiter/bill/BillCloseDialog";
import { BillItemPayDialog } from "@/components/waiter/bill/BillItemPayDialog";
import { BillItemRow } from "@/components/waiter/bill/BillItemRow";
import { BillPaymentsList } from "@/components/waiter/bill/BillPaymentsList";
import { BillSummaryBar } from "@/components/waiter/bill/BillSummaryBar";
import { billCardClass, billSoftBgClass, paymentMethodLabel } from "@/components/waiter/bill/bill-utils";
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
  payWaiterBillShare,
  removeWaiterBillItem,
  reverseWaiterBillPayment,
  updateWaiterBillItemQuantity,
  WaiterApiError,
  type WaiterBill,
  type WaiterBillItem,
  type WaiterBillPayment,
  type WaiterTableSummary,
} from "@/lib/waiter-api";

function tableLabel(table: WaiterTableSummary): string {
  return table.tableName || `Masa ${table.tableNumber ?? table.tableId}`;
}

type CloseSuccessSummary = {
  total: string;
  paymentMethod?: "CASH" | "CARD";
};

async function invalidateBillQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  tableId: number,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["waiter-open-bill", tableId] }),
    queryClient.invalidateQueries({ queryKey: ["waiter-orders-tables"] }),
    queryClient.invalidateQueries({ queryKey: ["waiter-orders-today"] }),
    queryClient.invalidateQueries({ queryKey: ["waiter-table-today", tableId] }),
    queryClient.invalidateQueries({ queryKey: ["waiter-commissions-today"] }),
    queryClient.invalidateQueries({ queryKey: ["waiter-commissions-history"] }),
    queryClient.invalidateQueries({ queryKey: ["waiter-bill-split-preview"] }),
  ]);
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
  const [payItemTarget, setPayItemTarget] = useState<WaiterBillItem | null>(null);
  const [reversePaymentTarget, setReversePaymentTarget] = useState<WaiterBillPayment | null>(null);
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
      await invalidateBillQueries(queryClient, table.tableId);
    },
  });

  const payItemsMutation = useMutation({
    mutationFn: (payload: {
      billId: number;
      itemId: number;
      quantityToPay: number;
      paymentMethod: "CASH" | "CARD";
    }) =>
      payWaiterBillItems(payload.billId, {
        paymentMethod: payload.paymentMethod,
        items: [{ itemId: payload.itemId, quantityToPay: payload.quantityToPay }],
      }),
    onSuccess: async (updatedBill: WaiterBill) => {
      await invalidateBillQueries(queryClient, table.tableId);
      setPayItemTarget(null);
      if (updatedBill.status === "CLOSED") {
        handleBillClosed(updatedBill);
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
    onSuccess: (updatedBill: WaiterBill, variables) => {
      void invalidateBillQueries(queryClient, table.tableId);
      setConfirmCloseOpen(false);
      handleBillClosed(updatedBill, variables.paymentMethod);
    },
  });

  const payShareMutation = useMutation({
    mutationFn: (payload: {
      billId: number;
      personCount: number;
      shareNumber: number;
      paymentMethod: "CASH" | "CARD";
      tipReceived?: boolean;
      tipAmount?: number;
    }) => payWaiterBillShare(payload.billId, payload),
    onSuccess: async (updatedBill: WaiterBill) => {
      await invalidateBillQueries(queryClient, table.tableId);
      if (updatedBill.status === "CLOSED") {
        setConfirmCloseOpen(false);
        handleBillClosed(updatedBill);
      }
    },
  });

  const reversePaymentMutation = useMutation({
    mutationFn: (payload: { billId: number; paymentId: number }) =>
      reverseWaiterBillPayment(payload.billId, payload.paymentId),
    onSuccess: async () => {
      await invalidateBillQueries(queryClient, table.tableId);
      setReversePaymentTarget(null);
    },
  });

  function handleBillClosed(bill: WaiterBill, paymentMethod?: "CASH" | "CARD") {
    setCloseSuccess({
      total: formatMenuPrice(bill.totalAmount ?? undefined, bill.currency || "TRY"),
      paymentMethod,
    });
  }

  const bill = billQuery.data;
  const currency = bill?.currency || "TRY";
  const busy =
    itemMutation.isPending ||
    closeMutation.isPending ||
    payItemsMutation.isPending ||
    payShareMutation.isPending ||
    reversePaymentMutation.isPending;

  if (!hasOpenBill) {
    return (
      <section className={`${billCardClass} border-dashed text-center`}>
        <p className="text-sm text-zinc-500">Bu masada açık adisyon yok.</p>
        <Button type="button" className="mt-4 gap-1.5 bg-zinc-900 text-white hover:bg-zinc-800" onClick={onAddProducts}>
          <Plus className="h-4 w-4" />
          Sipariş oluştur
        </Button>
      </section>
    );
  }

  if (billQuery.isLoading) {
    return (
      <div className={`flex justify-center py-10 ${billSoftBgClass} text-zinc-400`}>
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (billQuery.isError) {
    return (
      <p className="text-sm text-red-600">
        {billQuery.error instanceof WaiterApiError
          ? billQuery.error.message
          : "Adisyon yüklenemedi."}
      </p>
    );
  }

  const items = bill?.items ?? [];
  const payments = bill?.payments ?? [];

  return (
    <>
      <section className={`${billCardClass} space-y-3`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-zinc-900">Açık adisyon</h3>
            <p className="text-xs text-zinc-500">
              {tableLabel(table)} · #{bill?.id}
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-800">
            Açık
          </span>
        </div>

        <BillSummaryBar
          total={bill?.totalAmount}
          paid={bill?.paidTotal}
          remaining={bill?.remainingTotal}
          currency={currency}
        />

        {itemMutation.isError ? (
          <p className="text-sm text-red-600">
            {itemMutation.error instanceof WaiterApiError
              ? itemMutation.error.message
              : "Kalem güncellenemedi."}
          </p>
        ) : null}

        {payItemsMutation.isError ? (
          <p className="text-sm text-red-600">
            {payItemsMutation.error instanceof WaiterApiError
              ? payItemsMutation.error.message
              : "Ödeme alınamadı."}
          </p>
        ) : null}

        {closeMutation.isError || payShareMutation.isError ? (
          <p className="text-sm text-red-600">
            {(closeMutation.error ?? payShareMutation.error) instanceof WaiterApiError
              ? (closeMutation.error ?? payShareMutation.error)?.message
              : "Masa kapatılamadı."}
          </p>
        ) : null}

        {reversePaymentMutation.isError ? (
          <p className="text-sm text-red-600">
            {reversePaymentMutation.error instanceof WaiterApiError
              ? reversePaymentMutation.error.message
              : "Ödeme geri alınamadı."}
          </p>
        ) : null}

        <ul className="space-y-2 border-t border-zinc-100 pt-3">
          {items.length === 0 ? (
            <li className="text-sm text-zinc-500">Henüz kalem yok.</li>
          ) : (
            items.map((item) => (
              <BillItemRow
                key={item.id}
                item={item}
                currency={currency}
                busy={busy}
                minQuantity={Math.max(1, item.paidQuantity ?? 0)}
                showDelete={(item.paidQuantity ?? 0) === 0}
                onQuantityChange={(quantity) =>
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
                onPay={() => setPayItemTarget(item)}
              />
            ))
          )}
        </ul>

        <BillPaymentsList
          payments={payments}
          currency={currency}
          busy={busy}
          reversingPaymentId={
            reversePaymentMutation.isPending
              ? reversePaymentMutation.variables?.paymentId
              : null
          }
          onReverse={(payment) => setReversePaymentTarget(payment)}
        />

        <div className="grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3">
          <Button
            type="button"
            variant="outline"
            className="border-zinc-200 text-zinc-800"
            disabled={busy}
            onClick={onAddProducts}
          >
            Ürün ekle
          </Button>
          <Button
            type="button"
            className="bg-zinc-900 text-white hover:bg-zinc-800"
            disabled={busy}
            onClick={() => setConfirmCloseOpen(true)}
          >
            {closeMutation.isPending || payShareMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Masayı kapat"
            )}
          </Button>
        </div>
      </section>

      <BillItemPayDialog
        open={payItemTarget != null}
        onOpenChange={(open) => {
          if (!open) setPayItemTarget(null);
        }}
        item={payItemTarget}
        currency={currency}
        busy={payItemsMutation.isPending}
        onConfirm={({ quantityToPay, paymentMethod }) => {
          if (!payItemTarget || !bill) return;
          payItemsMutation.mutate({
            billId: bill.id,
            itemId: payItemTarget.id,
            quantityToPay,
            paymentMethod,
          });
        }}
      />

      {bill ? (
        <BillCloseDialog
          open={confirmCloseOpen}
          onOpenChange={setConfirmCloseOpen}
          bill={bill}
          tableLabel={tableLabel(table)}
          currency={currency}
          busy={closeMutation.isPending || payShareMutation.isPending}
          onCloseFull={(payload) =>
            closeMutation.mutate({
              billId: bill.id,
              ...payload,
            })
          }
          onPayShare={(payload) =>
            payShareMutation.mutate({
              billId: bill.id,
              ...payload,
            })
          }
        />
      ) : null}

      <AlertDialog
        open={reversePaymentTarget != null}
        onOpenChange={(open) => {
          if (!open && !reversePaymentMutation.isPending) {
            setReversePaymentTarget(null);
          }
        }}
      >
        <AlertDialogContent className="border-zinc-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-900">Ödemeyi geri al</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1 text-sm text-zinc-500">
                <p>
                  {reversePaymentTarget?.itemSummary ?? "Bu ödeme"} kaydı silinecek ve tutar
                  kalan bakiyeye eklenecek.
                </p>
                <p>
                  Tutar:{" "}
                  <span className="font-semibold text-zinc-900">
                    {formatMenuPrice(reversePaymentTarget?.amount ?? undefined, currency)}
                  </span>
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reversePaymentMutation.isPending}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="bg-zinc-900 text-white hover:bg-zinc-800"
              disabled={reversePaymentMutation.isPending || !bill || !reversePaymentTarget}
              onClick={(event) => {
                event.preventDefault();
                if (!bill || !reversePaymentTarget) return;
                reversePaymentMutation.mutate({
                  billId: bill.id,
                  paymentId: reversePaymentTarget.id,
                });
              }}
            >
              {reversePaymentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Geri al"
              )}
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
        <AlertDialogContent className="border-zinc-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-900">Masa kapatıldı</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1 text-sm text-zinc-500">
                <p>
                  Toplam:{" "}
                  <span className="font-semibold text-zinc-900">{closeSuccess?.total}</span>
                </p>
                {closeSuccess?.paymentMethod ? (
                  <p>
                    Ödeme:{" "}
                    <span className="font-semibold text-zinc-900">
                      {paymentMethodLabel(closeSuccess.paymentMethod)}
                    </span>
                  </p>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-zinc-900 text-white hover:bg-zinc-800">
              Tamam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
