import { cn } from "@/lib/utils";

export function DeltaText({
  value,
  suffix,
}: {
  value: number | null | undefined;
  suffix?: string;
}) {
  if (value == null || Number.isNaN(value)) return null;
  const up = value >= 0;
  return (
    <span
      className={cn(
        "text-xs font-medium tabular-nums",
        up ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
      )}
    >
      {up ? "+" : ""}
      {value.toFixed(1)}%{suffix ? ` ${suffix}` : ""}
    </span>
  );
}

export function DeltaPill({ value }: { value: number | null | undefined }) {
  if (value == null || Number.isNaN(value)) return null;
  const up = value >= 0;
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
        up
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
          : "bg-destructive/10 text-destructive",
      )}
    >
      {up ? "+" : ""}
      {Math.round(value)}%
    </span>
  );
}
