"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type DateRangePreset = "all" | "yesterday" | "today" | "7d" | "30d" | "custom";

export type DateRangeValue = {
  from: string;
  to: string;
};

type DateRangeFilterProps = {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  className?: string;
  label?: string;
};

const PRESETS: { id: Exclude<DateRangePreset, "custom">; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "yesterday", label: "Dün" },
  { id: "today", label: "Bugün" },
  { id: "7d", label: "7 gün" },
  { id: "30d", label: "30 gün" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatLocalYmd(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseLocalYmd(value: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function todayDateRange(): DateRangeValue {
  return presetRange("today");
}

export function openQueueDateRange(): DateRangeValue {
  return { from: "", to: "" };
}

function presetRange(id: Exclude<DateRangePreset, "custom">): DateRangeValue {
  if (id === "all") return openQueueDateRange();
  const today = startOfLocalDay();
  if (id === "today") {
    const ymd = formatLocalYmd(today);
    return { from: ymd, to: ymd };
  }
  if (id === "yesterday") {
    const yesterday = startOfLocalDay();
    yesterday.setDate(yesterday.getDate() - 1);
    const ymd = formatLocalYmd(yesterday);
    return { from: ymd, to: ymd };
  }
  const from = startOfLocalDay();
  from.setDate(from.getDate() - (id === "7d" ? 6 : 29));
  return { from: formatLocalYmd(from), to: formatLocalYmd(today) };
}

function detectPreset(value: DateRangeValue): DateRangePreset {
  if (!value.from && !value.to) return "all";
  if (!value.from || !value.to) return "custom";
  for (const preset of PRESETS) {
    const range = presetRange(preset.id);
    if (range.from === value.from && range.to === value.to) return preset.id;
  }
  return "custom";
}

function toDateRange(value: DateRangeValue): DateRange | undefined {
  const from = parseLocalYmd(value.from);
  const to = parseLocalYmd(value.to);
  if (!from && !to) return undefined;
  return { from, to };
}

function fromDateRange(range: DateRange | undefined): DateRangeValue {
  if (!range?.from) return { from: "", to: "" };
  return {
    from: formatLocalYmd(range.from),
    to: range.to ? formatLocalYmd(range.to) : "",
  };
}

function RangeEndpoint({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  const date = parseLocalYmd(value);
  return (
    <div
      className={cn(
        "flex-1 rounded-xl border px-2.5 py-1.5 transition-colors",
        active
          ? "border-border/50 bg-white shadow-sm dark:border-border/60 dark:bg-muted/60"
          : "border-transparent bg-muted/30",
      )}
    >
      <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-xs font-medium", date ? "text-foreground" : "text-muted-foreground")}>
        {date ? format(date, "d MMM yyyy", { locale: tr }) : "Seçilmedi"}
      </p>
    </div>
  );
}

export function DateRangeFilter({
  value,
  onChange,
  className,
  label = "Tarih",
}: DateRangeFilterProps) {
  const activePreset = useMemo(
    () => detectPreset({ from: value.from, to: value.to }),
    [value.from, value.to],
  );
  const customActive = activePreset === "custom";
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRangeValue>(value);
  const selected = useMemo(() => toDateRange(draft), [draft]);
  const canApply = Boolean(draft.from) === Boolean(draft.to);

  useEffect(() => {
    if (open) setDraft({ from: value.from, to: value.to });
  }, [open, value.from, value.to]);

  const applyPreset = (id: Exclude<DateRangePreset, "custom">) => {
    const next = presetRange(id);
    setOpen(false);
    setDraft(next);
    onChange(next);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setDraft(value);
    setOpen(nextOpen);
  };

  const rangeLabel = useMemo(() => {
    if (!value.from && !value.to) return "Tümü";
    const fromDate = parseLocalYmd(value.from);
    const toDate = parseLocalYmd(value.to);
    if (fromDate && toDate) {
      return `${format(fromDate, "d MMM yyyy", { locale: tr })} – ${format(toDate, "d MMM yyyy", { locale: tr })}`;
    }
    return "Tarih aralığı seç";
  }, [value.from, value.to]);

  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-border/60 bg-muted/30 p-1">
          {PRESETS.map((preset) => {
            const active = !customActive && !open && activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200",
                  active
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/70"
                    : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className={cn(
            "inline-flex h-9 items-center rounded-xl border border-border/50 bg-white px-3 text-sm shadow-sm transition-colors",
            "dark:border-border/60 dark:bg-muted/60",
            "hover:bg-white/90 dark:hover:bg-muted/70",
            (open || customActive) && "ring-1 ring-border/70",
            open || customActive || (value.from && value.to)
              ? "text-foreground"
              : "text-muted-foreground",
          )}
          onClick={() => setOpen(true)}
        >
          {rangeLabel}
        </button>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent
            className="w-auto max-w-[min(24rem,calc(100%-2rem))] gap-0 overflow-hidden rounded-2xl border-border/60 p-0 shadow-lg sm:rounded-2xl"
            overlayClassName="bg-black/40"
          >
            <DialogTitle className="sr-only">Tarih aralığı seç</DialogTitle>
            <DialogDescription className="sr-only">
              Başlangıç ve bitiş gününü seçip uygulayın
            </DialogDescription>
            <div className="space-y-2.5 border-b border-border/50 px-4 py-3 pr-12">
              <p className="text-xs text-muted-foreground">
                {draft.from && !draft.to
                  ? "Şimdi bitiş gününü seçin"
                  : "Önce başlangıç, sonra bitiş gününü seçin"}
              </p>
              <div className="flex items-center gap-2">
                <RangeEndpoint label="Başlangıç" value={draft.from} active={Boolean(draft.from)} />
                <span className="text-muted-foreground">–</span>
                <RangeEndpoint label="Bitiş" value={draft.to} active={Boolean(draft.to)} />
              </div>
            </div>
            <Calendar
              mode="range"
              numberOfMonths={1}
              selected={selected}
              onSelect={(range) => setDraft(fromDateRange(range))}
              defaultMonth={selected?.from ?? startOfLocalDay()}
              locale={tr}
              className="p-3"
            />
            <div className="flex items-center justify-between gap-2 border-t border-border/50 px-3 py-2.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-xl text-xs text-muted-foreground"
                onClick={() => setDraft({ from: "", to: "" })}
              >
                Temizle
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 rounded-xl px-3 text-xs"
                disabled={!canApply}
                onClick={() => {
                  onChange(draft);
                  setOpen(false);
                }}
              >
                Uygula
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
