/** API BigDecimal / string / null → sayı. */
export function toAmount(value?: number | string | null): number {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  return n != null && Number.isFinite(n) ? n : 0;
}

/** Para tutarı: 2 ondalık, HALF_UP (pozitif sayılarda JS Math.round). */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Pay yüzdesi: part / total × 100.
 * total ≤ 0 ise 0.
 */
export function revenueShare(part: number, total: number): number {
  if (total <= 0) return 0;
  return (part / total) * 100;
}

/** Cihaz dağılımı gibi tam yüzde: Math.round(part / total × 100). */
export function roundedSharePercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}
