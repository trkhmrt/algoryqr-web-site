import { roundedSharePercent } from "../numbers";
import type { ReportingMethodDef } from "../types";

export type VisitKpiId =
  | "sessions"
  | "menuOpens"
  | "productViews"
  | "averageProductsPerSession";

export const VISIT_METHODS: { [K in VisitKpiId]: ReportingMethodDef<K> } = {
  sessions: {
    id: "sessions",
    label: "Oturum",
    method: "sessionCount",
    formula: "COUNT(session)",
    filter: "startedAt/lastSeen dönemi [from, to] içinde olan menü oturumları",
    unit: "count",
  },
  menuOpens: {
    id: "menuOpens",
    label: "Menü açılışı",
    method: "menuOpenCount",
    formula: "COUNT(event where type = MENU_OPEN)",
    filter: "occurredAt ∈ [from, to]",
    unit: "count",
  },
  productViews: {
    id: "productViews",
    label: "Ürün görüntüleme",
    method: "productViewCount",
    formula: "COUNT(event where type = PRODUCT_VIEW)",
    filter: "occurredAt ∈ [from, to]",
    unit: "count",
  },
  averageProductsPerSession: {
    id: "averageProductsPerSession",
    label: "Ort. ürün / oturum",
    method: "averageProductsPerSession",
    formula: "AVG(COUNT(PRODUCT_VIEW) GROUP BY session_id)",
    filter: "Dönemde en az bir PRODUCT_VIEW’i olan oturumlar; 1 ondalık gösterim",
    unit: "ratio",
  },
};

export function sessionCount(value?: number | null): number {
  return value ?? 0;
}

export function menuOpenCount(value?: number | null): number {
  return value ?? 0;
}

export function productViewCount(value?: number | null): number {
  return value ?? 0;
}

export function categoryViewCount(value?: number | null): number {
  return value ?? 0;
}

/**
 * Ort. ürün / oturum.
 * Her oturumdaki PRODUCT_VIEW sayısı alınır, bu sayıların ortalaması alınır.
 * PRODUCT_VIEW’i olmayan oturumlar ortalamaya girmez.
 */
export function averageProductsPerSession(value?: number | null): number {
  const n = value ?? 0;
  return Number.isFinite(n) ? n : 0;
}

export function formatAverageProductsPerSession(value: number): string {
  return value.toFixed(1);
}

/** Saatlik yoğunluk: o saatteki tüm analitik olay adedi. */
export function hourlyEventCount(value?: number | null): number {
  return value ?? 0;
}

export function formatHourLabel(hour: number): string {
  return String(hour).padStart(2, "0");
}

/** Cihaz payı (%): cihaz oturumları / tüm cihaz oturumları. */
export function deviceSharePercent(count: number, total: number): number {
  return roundedSharePercent(count, total);
}

export function deviceTotal(devices: { value: number }[]): number {
  return devices.reduce((sum, row) => sum + row.value, 0);
}

/** Treemap kutusu: kategorideki ürün görüntülemeleri toplamı. */
export function treemapSize(value?: number | null): number {
  return value ?? 0;
}

export function isVisitReportEmpty(sessions: number, menuOpens: number): boolean {
  return sessions === 0 && menuOpens === 0;
}
