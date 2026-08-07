import { formatPackageDate, formatPackagePrice } from "@/lib/package-display";

export const REFUND_BANK_ETA_COPY = "3–4 iş günü içinde kartınıza yansır";

export type RefundStatusValue = "NONE" | "PENDING" | "COMPLETED" | "NEEDS_RECONCILE" | string;

export function toAmountNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const amount = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(amount) ? amount : 0;
}

export function resolveRefundDisplayAmount(
  refundableAmount: number | string | null | undefined,
  price: number | string | null | undefined,
): number {
  const refundable = toAmountNumber(refundableAmount);
  if (refundable > 0) return refundable;
  return toAmountNumber(price);
}

export function formatRefundCardLabel(
  cardBrand?: string | null,
  cardLastFour?: string | null,
): string {
  if (cardLastFour) {
    return `${(cardBrand || "Kart").toString()} **** ${cardLastFour}`;
  }
  return "Orijinal ödeme yöntemi";
}

export function formatRefundEligibleUntilLabel(iso?: string | null): string | null {
  if (!iso) return null;
  const formatted = formatPackageDate(iso);
  if (formatted === "—") return null;
  return `İade hakkınız ${formatted} tarihine kadar geçerli`;
}

export function formatRefundCoolingPolicy(days?: number | null): string | null {
  if (days == null || !Number.isFinite(days) || days <= 0) return null;
  return `Ödeme sonrası ${days} gün içinde iade talep edebilirsiniz.`;
}

export function refundStatusLabel(status?: string | null): string | null {
  switch (status) {
    case "PENDING":
      return "İade işleniyor";
    case "COMPLETED":
      return "İade edildi";
    case "NEEDS_RECONCILE":
      return "İade tamamlandı, abonelik senkronu bekleniyor";
    default:
      return null;
  }
}

export function purchaseStatusLabel(status?: string | null): string {
  switch (status) {
    case "PENDING":
      return "Bekliyor";
    case "ACTIVE":
      return "Aktif";
    case "FAILED":
      return "Başarısız";
    case "CANCELLED":
      return "İptal edildi";
    case "EXPIRED":
      return "Süresi doldu";
    case "SUPERSEDED":
      return "Değiştirildi";
    default:
      return status || "—";
  }
}

export function isRefundInFlight(status?: string | null): boolean {
  return status === "PENDING";
}

export function isRefundCompleted(status?: string | null, refundedAt?: string | null): boolean {
  return status === "COMPLETED" || status === "NEEDS_RECONCILE" || !!refundedAt;
}

export function refundEligibilityBadgeLabel(_refundEligible?: boolean | null): null {
  return null;
}

export function formatRefundAmountLabel(
  amount: number | string | null | undefined,
  currency?: string | null,
): string {
  return formatPackagePrice(toAmountNumber(amount), currency ?? "TRY");
}
