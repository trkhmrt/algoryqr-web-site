"use client";

import { CheckCircle2, Clock3, CreditCard } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatPackageDate } from "@/lib/package-display";
import {
  REFUND_BANK_ETA_COPY,
  formatRefundAmountLabel,
  formatRefundCardLabel,
  isRefundCompleted,
  isRefundInFlight,
  refundStatusLabel,
  resolveRefundDisplayAmount,
} from "@/lib/refund-display";

type RefundStatusPanelProps = {
  packageName: string;
  price: number | string;
  currency?: string | null;
  refundableAmount?: number | string | null;
  refundStatus?: string | null;
  refundedAt?: string | null;
  cardBrand?: string | null;
  cardLastFour?: string | null;
};

export default function RefundStatusPanel({
  packageName,
  price,
  currency,
  refundableAmount,
  refundStatus,
  refundedAt,
  cardBrand,
  cardLastFour,
}: RefundStatusPanelProps) {
  const inFlight = isRefundInFlight(refundStatus);
  const completed = isRefundCompleted(refundStatus, refundedAt);
  if (!inFlight && !completed) {
    return null;
  }

  const amount = resolveRefundDisplayAmount(refundableAmount, price);
  const statusLabel = refundStatusLabel(refundStatus) ?? (completed ? "İade edildi" : "İade işleniyor");
  const cardLabel = formatRefundCardLabel(cardBrand, cardLastFour);

  return (
    <Card className="glow-card border-emerald-500/30">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start gap-3">
          {inFlight ? (
            <Clock3 className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{statusLabel}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {inFlight
                ? `${packageName} için iade işlemi sürüyor. Lütfen bekleyin; tekrar denemeyin.`
                : `${packageName} aboneliği iptal edildi ve iade başlatıldı.`}
            </p>
          </div>
        </div>
        <div className="space-y-2 rounded-lg border border-border/70 bg-background p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">İade tutarı</span>
            <span className="font-semibold text-foreground">
              {formatRefundAmountLabel(amount, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Hedef</span>
            <span className="flex items-center gap-1.5 text-foreground">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
              {cardLabel}
            </span>
          </div>
          {refundedAt ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">İade tarihi</span>
              <span className="text-foreground">{formatPackageDate(refundedAt)}</span>
            </div>
          ) : null}
        </div>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="font-medium text-foreground">1.</span>
            <span>İade talebi sistemde kaydedildi.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-foreground">2.</span>
            <span>
              {inFlight
                ? "Ödeme sağlayıcısına iletiliyor…"
                : "Ödeme sağlayıcısı iadeyi işleme aldı."}
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-foreground">3.</span>
            <span>{REFUND_BANK_ETA_COPY}</span>
          </li>
        </ol>
      </CardContent>
    </Card>
  );
}
