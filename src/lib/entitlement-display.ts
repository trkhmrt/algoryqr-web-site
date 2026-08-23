import type { UserEntitlementApiItem } from "@/lib/api";

const QUANTITY_ENTITLEMENT_CODES = new Set(["QR_CREATE", "QR_MENU", "QR_BRANCH"]);

type EntitlementUsageFields = Pick<
  UserEntitlementApiItem,
  "productCode" | "unlimited" | "usedQuantity" | "totalQuantity" | "remainingQuantity" | "usable" | "expired"
>;

export function isQuantityEntitlement(productCode: string): boolean {
  return QUANTITY_ENTITLEMENT_CODES.has(productCode);
}

export function formatEntitlementUsageSummary(product: EntitlementUsageFields): string {
  if (product.unlimited) {
    return "Sınırsız";
  }
  if (isQuantityEntitlement(product.productCode)) {
    return `${product.usedQuantity}/${product.totalQuantity} · ${product.remainingQuantity} kalan`;
  }
  if (!product.usable || product.expired) {
    return "Pasif";
  }
  return "Aktif";
}

export function formatEntitlementUsed(product: EntitlementUsageFields): string {
  if (product.unlimited) {
    return "—";
  }
  if (isQuantityEntitlement(product.productCode)) {
    return `${product.usedQuantity}/${product.totalQuantity}`;
  }
  if (!product.usable || product.expired) {
    return "—";
  }
  return "Kullanımda";
}

export function formatEntitlementRemaining(product: EntitlementUsageFields): string {
  if (product.unlimited) {
    return "Sınırsız";
  }
  if (isQuantityEntitlement(product.productCode)) {
    return String(product.remainingQuantity);
  }
  if (!product.usable || product.expired) {
    return "Pasif";
  }
  return "Aktif";
}

export type MenuEntitlementSummary = {
  remaining: number;
  total: number;
  used: number;
  unlimited: boolean;
};

export function summarizeMenuEntitlements(
  entitlements: UserEntitlementApiItem[],
): MenuEntitlementSummary | null {
  const active = entitlements.filter(
    (item) =>
      item.productCode === "QR_MENU" &&
      !item.expired &&
      (item.usable || item.totalQuantity > 0),
  );
  if (active.length === 0) {
    return null;
  }
  if (active.some((item) => item.unlimited)) {
    return { remaining: Number.POSITIVE_INFINITY, total: 0, used: 0, unlimited: true };
  }
  return {
    remaining: active.reduce((sum, item) => sum + item.remainingQuantity, 0),
    total: active.reduce((sum, item) => sum + item.totalQuantity, 0),
    used: active.reduce((sum, item) => sum + item.usedQuantity, 0),
    unlimited: false,
  };
}

export function formatMenuQuotaLabel(summary: MenuEntitlementSummary | null): string | null {
  if (!summary) {
    return null;
  }
  if (summary.unlimited) {
    return "Sınırsız menü hakkı";
  }
  if (summary.remaining <= 0) {
    return "Dijital menü hakkınız doldu";
  }
  if (summary.remaining === 1) {
    return "1 menü hakkınız kaldı";
  }
  return `${summary.remaining} menü hakkınız kaldı`;
}

export function canCreateMenu(summary: MenuEntitlementSummary | null): boolean {
  if (!summary) {
    return true;
  }
  return summary.unlimited || summary.remaining > 0;
}

export type QrCreateQuotaSummary = {
  remaining: number;
  total: number;
  used: number;
  unlimited: boolean;
  usable: boolean;
};

export function summarizeQrCreateQuota(input: {
  remaining: number;
  total: number;
  used: number;
  unlimited: boolean;
  usable?: boolean;
}): QrCreateQuotaSummary {
  return {
    remaining: input.remaining,
    total: input.total,
    used: input.used,
    unlimited: input.unlimited,
    usable: input.usable ?? true,
  };
}

export function formatQrCreateQuotaLabel(summary: QrCreateQuotaSummary | null): string | null {
  if (!summary) {
    return null;
  }
  if (!summary.usable) {
    return "QR oluşturmak için aktif bir paket gerekli";
  }
  if (summary.unlimited) {
    return "Sınırsız QR oluşturma hakkı";
  }
  if (summary.remaining <= 0) {
    return "QR oluşturma hakkınız bitti";
  }
  if (summary.remaining === 1) {
    return "1 QR oluşturma hakkınız kaldı";
  }
  return `${summary.remaining} QR oluşturma hakkınız kaldı`;
}

export function hasQrCreateQuotaRemaining(summary: QrCreateQuotaSummary | null): boolean {
  if (!summary?.usable) {
    return false;
  }
  return summary.unlimited || summary.remaining > 0;
}
