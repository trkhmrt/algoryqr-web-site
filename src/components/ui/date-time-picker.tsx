"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type DateTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseLocalDateTime(value: string): { date?: Date; hours: string; minutes: string } {
  if (!value) return { hours: "00", minutes: "00" };
  const [datePart, timePart = "00:00"] = value.split("T");
  const [y, m, d] = (datePart ?? "").split("-").map(Number);
  const [h = "00", min = "00"] = timePart.split(":");
  if (!y || !m || !d) return { hours: pad(Number(h) || 0), minutes: pad(Number(min) || 0) };
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) {
    return { hours: pad(Number(h) || 0), minutes: pad(Number(min) || 0) };
  }
  return { date, hours: pad(Number(h) || 0), minutes: pad(Number(min) || 0) };
}

function toLocalDateTimeValue(date: Date, hours: string, minutes: string): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(Number(hours) || 0)}:${pad(Number(minutes) || 0)}`;
}

export function DateTimePicker({
  value,
  onChange,
  className,
  placeholder = "Tarih ve saat seç",
  disabled,
}: DateTimePickerProps) {
  const parsed = useMemo(() => parseLocalDateTime(value), [value]);
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date | undefined>(parsed.date);
  const [draftHours, setDraftHours] = useState(parsed.hours);
  const [draftMinutes, setDraftMinutes] = useState(parsed.minutes);

  useEffect(() => {
    if (!open) return;
    const next = parseLocalDateTime(value);
    setDraftDate(next.date ?? new Date());
    setDraftHours(next.hours);
    setDraftMinutes(next.minutes);
  }, [open, value]);

  const label = useMemo(() => {
    if (!parsed.date) return placeholder;
    return `${format(parsed.date, "d MMM yyyy", { locale: tr })} · ${parsed.hours}:${parsed.minutes}`;
  }, [parsed, placeholder]);

  const canApply = draftDate != null;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm transition-colors hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50",
          !parsed.date && "text-muted-foreground",
          className,
        )}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 truncate">{label}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="w-auto max-w-[min(24rem,calc(100%-2rem))] gap-0 overflow-hidden rounded-2xl border-border/60 p-0 shadow-lg sm:rounded-2xl"
          overlayClassName="bg-black/40"
        >
          <DialogTitle className="sr-only">Tarih ve saat seç</DialogTitle>
          <DialogDescription className="sr-only">
            Gün seçin, saati ayarlayıp uygulayın
          </DialogDescription>
          <div className="space-y-2 border-b border-border/50 px-4 py-3 pr-12">
            <p className="text-xs text-muted-foreground">Tarih ve saat</p>
            <p className="text-sm font-medium text-foreground">
              {draftDate
                ? `${format(draftDate, "d MMM yyyy", { locale: tr })} · ${pad(Number(draftHours) || 0)}:${pad(Number(draftMinutes) || 0)}`
                : "Seçilmedi"}
            </p>
          </div>
          <Calendar
            mode="single"
            numberOfMonths={1}
            selected={draftDate}
            onSelect={(date) => setDraftDate(date)}
            defaultMonth={draftDate ?? new Date()}
            locale={tr}
            className="p-3"
          />
          <div className="flex items-center gap-2 border-t border-border/50 px-4 py-3">
            <label className="text-xs text-muted-foreground">Saat</label>
            <input
              type="number"
              min={0}
              max={23}
              value={draftHours}
              onChange={(event) => {
                const next = event.target.value.replace(/\D/g, "").slice(0, 2);
                setDraftHours(next);
              }}
              className="h-9 w-14 rounded-xl border border-border/60 bg-background px-2 text-center text-sm tabular-nums"
              aria-label="Saat"
            />
            <span className="text-muted-foreground">:</span>
            <input
              type="number"
              min={0}
              max={59}
              value={draftMinutes}
              onChange={(event) => {
                const next = event.target.value.replace(/\D/g, "").slice(0, 2);
                setDraftMinutes(next);
              }}
              className="h-9 w-14 rounded-xl border border-border/60 bg-background px-2 text-center text-sm tabular-nums"
              aria-label="Dakika"
            />
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border/50 px-3 py-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-xl text-xs text-muted-foreground"
              onClick={() => {
                const now = new Date();
                setDraftDate(now);
                setDraftHours(pad(now.getHours()));
                setDraftMinutes(pad(now.getMinutes()));
              }}
            >
              Şimdi
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-xl px-3 text-xs"
              disabled={!canApply}
              onClick={() => {
                if (!draftDate) return;
                onChange(toLocalDateTimeValue(draftDate, draftHours, draftMinutes));
                setOpen(false);
              }}
            >
              Uygula
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
