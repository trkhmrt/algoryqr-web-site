import type { ChartConfig } from "@/components/ui/chart";
import { formatMenuPrice } from "@/components/menu-templates/types";

export const CHART_COLORS = {
  c1: "hsl(var(--chart-1))",
  c2: "hsl(var(--chart-2))",
  c3: "hsl(var(--chart-3))",
  c4: "hsl(var(--chart-4))",
  c5: "hsl(var(--chart-5))",
} as const;

export function money(value: number, currency = "TRY"): string {
  return formatMenuPrice(value, currency);
}

export function num(value: number | string | null | undefined): number {
  return Number(value ?? 0);
}

export function dayLabel(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return date.slice(5);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function pctDelta(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

export function halfSplit<T>(arr: T[]): [T[], T[]] {
  const mid = Math.max(1, Math.floor(arr.length / 2));
  return [arr.slice(0, mid), arr.slice(mid)];
}

export function seriesConfig(
  entries: { key: string; label: string; color?: string }[],
): ChartConfig {
  const config: ChartConfig = {};
  entries.forEach((entry, index) => {
    config[entry.key] = {
      label: entry.label,
      color: entry.color ?? `hsl(var(--chart-${(index % 5) + 1}))`,
    };
  });
  return config;
}
