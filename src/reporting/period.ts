import type { AnalyticsPeriod } from "./types";

/**
 * Rapor penceresi: Bugün = [bugün, bugün], 7 gün = [bugün-6, bugün], 30 gün = [bugün-29, bugün].
 * Tarihler yerel günün ISO tarihi (YYYY-MM-DD).
 */
export function reportingPeriodRange(period: AnalyticsPeriod): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (period !== "1d") {
    const days = period === "7d" ? 6 : 29;
    from.setDate(to.getDate() - days);
  }
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export function formatReportingDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}
