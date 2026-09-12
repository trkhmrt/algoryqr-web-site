import type { AnalyticsPeriod } from "./types";

export const COMPARE_PERIOD_MODES = ["week", "year", "previous"] as const;
export type ComparePeriodMode = (typeof COMPARE_PERIOD_MODES)[number];

export type DateRange = { from: string; to: string };

const MS_PER_DAY = 86_400_000;

export function reportingPeriodRange(period: AnalyticsPeriod): DateRange {
  const to = new Date();
  const from = new Date();
  if (period === "yesterday") {
    from.setDate(to.getDate() - 1);
    to.setDate(to.getDate() - 1);
  } else if (period !== "1d") {
    const days = period === "7d" ? 6 : 29;
    from.setDate(to.getDate() - days);
  }
  return { from: formatIsoDate(from), to: formatIsoDate(to) };
}

export function formatReportingDate(value: string): string {
  const date = parseIsoDate(value);
  if (!date) return value;
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function comparePeriodRange(from: string, to: string, mode: ComparePeriodMode): DateRange {
  if (mode === "week") return shiftRangeDays(from, to, -7);
  if (mode === "year") return shiftRangeYears(from, to, -1);
  return previousEqualRange(from, to);
}

export function eachIsoDate(from: string, to: string): string[] {
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);
  if (!start || !end || start > end) return [];
  const dates: string[] = [];
  const cursor = start;
  while (cursor <= end && dates.length < 366) {
    dates.push(formatIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function previousEqualRange(from: string, to: string): DateRange {
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);
  if (!start || !end) return { from, to };
  const spanDays = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
  const previousTo = shiftDate(from, -1);
  return { from: shiftDate(previousTo, -spanDays), to: previousTo };
}

function shiftRangeDays(from: string, to: string, days: number): DateRange {
  return { from: shiftDate(from, days), to: shiftDate(to, days) };
}

function shiftRangeYears(from: string, to: string, years: number): DateRange {
  return { from: shiftYears(from, years), to: shiftYears(to, years) };
}

function shiftDate(value: string, days: number): string {
  const date = parseIsoDate(value);
  if (!date) return value;
  date.setDate(date.getDate() + days);
  return formatIsoDate(date);
}

function shiftYears(value: string, years: number): string {
  const date = parseIsoDate(value);
  if (!date) return value;
  date.setFullYear(date.getFullYear() + years);
  return formatIsoDate(date);
}

function formatIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
