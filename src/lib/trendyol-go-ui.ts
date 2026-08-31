import type { TrendyolGoConnectionStatus } from "@/lib/trendyol-go-api";

import { DASHBOARD_SURFACE } from "@/lib/dashboard-surface";

export const TGO_SOFT_CARD_CLASS = DASHBOARD_SURFACE;

export const TGO_SOFT_FIELD_CLASS =
  "rounded-xl border border-border bg-muted px-3 py-2.5";

export function formatTrendyolGoDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTrendyolGoAmount(value?: number | null, currency = "TRY"): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function connectionStatusLabel(status?: TrendyolGoConnectionStatus | string | null): string {
  switch (status) {
    case "CONNECTED":
      return "Bağlı";
    case "PENDING_RESTAURANT":
      return "Restoran seçin";
    case "ERROR":
      return "Hata";
    case "DISCONNECTED":
      return "Bağlı değil";
    default:
      return "Bağlı değil";
  }
}

export function connectionStatusClass(status?: TrendyolGoConnectionStatus | string | null): string {
  switch (status) {
    case "CONNECTED":
      return "bg-emerald-500/15 text-emerald-700";
    case "PENDING_RESTAURANT":
      return "bg-amber-500/15 text-amber-700";
    case "ERROR":
      return "bg-red-500/15 text-red-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

const PACKAGE_STATUS_LABELS: Record<string, string> = {
  created: "Yeni sipariş",
  accepted: "Kabul edildi",
  prepared: "Hazır",
  ready: "Hazır",
  rejected: "Reddedildi",
  cancelled: "İptal edildi",
  canceled: "İptal edildi",
  delivered: "Teslim edildi",
  onway: "Yolda",
  ontheway: "Yolda",
  picking: "Hazırlanıyor",
  picked: "Alındı",
  unassigned: "Atanmadı",
  completed: "Tamamlandı",
};

export function packageStatusLabel(status?: string | null): string {
  if (!status?.trim()) return "—";
  const normalized = status.trim().toLowerCase().replace(/[\s_-]+/g, "");
  return PACKAGE_STATUS_LABELS[normalized] ?? humanizeStatus(status);
}

function humanizeStatus(status: string): string {
  return status
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
}

export function packageStatusClass(status?: string | null): string {
  const normalized = status?.trim().toLowerCase().replace(/[\s_-]+/g, "") ?? "";
  switch (normalized) {
    case "created":
    case "unassigned":
      return "bg-sky-500/15 text-sky-700";
    case "accepted":
    case "picking":
      return "bg-amber-500/15 text-amber-700";
    case "prepared":
    case "ready":
    case "picked":
      return "bg-emerald-500/15 text-emerald-700";
    case "onway":
    case "ontheway":
    case "delivered":
    case "completed":
      return "bg-violet-500/15 text-violet-700";
    case "rejected":
    case "cancelled":
    case "canceled":
      return "bg-red-500/15 text-red-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function formatOrderReference(externalOrderId?: string | null): string {
  if (!externalOrderId?.trim()) return "Sipariş";
  const id = externalOrderId.trim();
  if (id.length <= 10) return `#${id}`;
  return `#${id.slice(-8).toUpperCase()}`;
}

export function shortDisplayId(value?: string | null, visible = 8): string {
  if (!value?.trim()) return "—";
  const id = value.trim();
  if (id.length <= visible + 4) return id;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

export function productAvailabilityLabel(available: boolean): string {
  return available ? "Satışta" : "Kapalı";
}

export function productAvailabilityClass(available: boolean): string {
  return available ? "bg-emerald-500/15 text-emerald-700" : "bg-muted text-muted-foreground";
}

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  store: "Restoran teslimat",
  go: "Uber Eats kuryesi",
  trendyol: "Uber Eats kuryesi",
  platform: "Uber Eats kuryesi",
  uber: "Uber Eats kuryesi",
  ubereats: "Uber Eats kuryesi",
  normal: "Standart teslimat",
  shipment: "Kargo teslimat",
  pickup: "Gel-al",
  delivery: "Adrese teslim",
};

export function deliveryTypeLabel(value?: string | null): string {
  if (!value?.trim()) return "—";
  const normalized = value.trim().toLowerCase().replace(/[\s_-]+/g, "");
  return DELIVERY_TYPE_LABELS[normalized] ?? humanizeStatus(value);
}

export function paymentMethodLabel(value?: string | null): string {
  if (!value?.trim()) return "—";
  const normalized = value.trim().toLowerCase();
  if (
    normalized.includes("online") ||
    normalized.includes("card") ||
    normalized.includes("kredi") ||
    normalized.includes("paywithcard")
  ) {
    return "Online kredi kartı";
  }
  if (normalized.includes("cod") || normalized.includes("kapida") || normalized.includes("cash")) {
    return "Kapıda ödeme";
  }
  return value.trim();
}

export function displayValue(value?: string | null): string {
  if (!value?.trim()) return "—";
  return value.trim();
}
