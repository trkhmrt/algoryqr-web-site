"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { getPurchaseSummary } from "@/lib/purchase-fulfillment";
import {
  REFUND_BANK_ETA_COPY,
  formatRefundAmountLabel,
  formatRefundCardLabel,
  resolveRefundDisplayAmount,
} from "@/lib/refund-display";
import { cn } from "@/lib/utils";

export type RefundConfirmPurchase = {
  purchaseId: number;
  packageName: string;
  price: number | string;
  currency?: string | null;
  refundableAmount?: number | string | null;
  refundEligibleUntil?: string | null;
  refundCoolingDays?: number | null;
  cardBrand?: string | null;
  cardLastFour?: string | null;
};

type CancelChoice = "refund_now" | "period_end";

type RefundConfirmDialogProps = {
  purchase: RefundConfirmPurchase;
  disabled?: boolean;
  isPending?: boolean;
  triggerLabel?: string;
  allowRefundNow?: boolean;
  allowPeriodEnd?: boolean;
  onConfirm: () => void;
  onPreferPeriodEnd?: () => void;
};

export default function RefundConfirmDialog({
  purchase,
  disabled,
  isPending,
  triggerLabel = "İade / İptal",
  allowRefundNow = true,
  allowPeriodEnd = false,
  onConfirm,
  onPreferPeriodEnd,
}: RefundConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<CancelChoice | null>(null);
  const [enriched, setEnriched] = useState(purchase);

  const showRefundOption = allowRefundNow;
  const showPeriodEndOption = allowPeriodEnd && !!onPreferPeriodEnd;
  const needsEnrichment = open && showRefundOption && purchase.refundableAmount == null;
  const summaryQuery = useQuery({
    queryKey: ["purchaseSummary", purchase.purchaseId, "refund-preview"],
    queryFn: () => getPurchaseSummary(purchase.purchaseId),
    enabled: needsEnrichment,
    staleTime: 15_000,
  });

  useEffect(() => {
    setEnriched(purchase);
  }, [purchase]);

  useEffect(() => {
    if (!summaryQuery.data) return;
    setEnriched((current) => ({
      ...current,
      refundableAmount: summaryQuery.data.refundableAmount ?? current.refundableAmount,
      refundEligibleUntil: summaryQuery.data.refundEligibleUntil ?? current.refundEligibleUntil,
      refundCoolingDays: summaryQuery.data.refundCoolingDays ?? current.refundCoolingDays,
      cardBrand: summaryQuery.data.cardBrand ?? current.cardBrand,
      cardLastFour: summaryQuery.data.cardLastFour ?? current.cardLastFour,
      price: summaryQuery.data.price ?? current.price,
      currency: summaryQuery.data.currency ?? current.currency,
    }));
  }, [summaryQuery.data]);

  useEffect(() => {
    if (!open) {
      setChoice(null);
      return;
    }
    if (showRefundOption && !showPeriodEndOption) {
      setChoice("refund_now");
    } else if (!showRefundOption && showPeriodEndOption) {
      setChoice("period_end");
    } else {
      setChoice(null);
    }
  }, [open, showRefundOption, showPeriodEndOption]);

  const amount = resolveRefundDisplayAmount(enriched.refundableAmount, enriched.price);
  const amountLabel = formatRefundAmountLabel(amount, enriched.currency);
  const cardLabel = formatRefundCardLabel(enriched.cardBrand, enriched.cardLastFour);
  const canSubmit =
    (choice === "refund_now" && showRefundOption) ||
    (choice === "period_end" && showPeriodEndOption);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled || isPending}>
          {isPending ? "İşleniyor…" : triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Paketi nasıl sonlandırmak istersiniz?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">{enriched.packageName}</span> paketi
                için bir seçenek belirleyin.
              </p>
              <div className="space-y-2">
                {showRefundOption ? (
                  <button
                    type="button"
                    onClick={() => setChoice("refund_now")}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-colors",
                      choice === "refund_now"
                        ? "border-primary bg-primary/5"
                        : "border-border/70 hover:border-primary/40",
                    )}
                  >
                    <p className="font-medium text-foreground">Şimdi iade yap</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Paket kullanım hakları hemen bitirilir. Para iadesi {REFUND_BANK_ETA_COPY}.
                    </p>
                    {choice === "refund_now" ? (
                      <div className="mt-3 space-y-2 rounded-md border border-border/60 bg-muted/40 p-2.5 text-foreground">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">İade tutarı</span>
                          <span className="font-semibold">{amountLabel}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">İade hedefi</span>
                          <span className="text-right font-medium">{cardLabel}</span>
                        </div>
                      </div>
                    ) : null}
                  </button>
                ) : null}
                {showPeriodEndOption ? (
                  <button
                    type="button"
                    onClick={() => setChoice("period_end")}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-colors",
                      choice === "period_end"
                        ? "border-primary bg-primary/5"
                        : "border-border/70 hover:border-primary/40",
                    )}
                  >
                    <p className="font-medium text-foreground">Dönem sonunda bitir</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Erişiminiz dönem sonuna kadar devam eder. Sonraki dönem için ücret alınmaz;
                      iade yapılmaz.
                    </p>
                  </button>
                ) : null}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Vazgeç</AlertDialogCancel>
          <Button
            type="button"
            disabled={!canSubmit || isPending}
            onClick={() => {
              if (!canSubmit) return;
              setOpen(false);
              if (choice === "period_end") {
                onPreferPeriodEnd?.();
                return;
              }
              onConfirm();
            }}
          >
            Onayla
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
