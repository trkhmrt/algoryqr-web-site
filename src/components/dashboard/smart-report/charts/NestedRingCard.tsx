"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type TrackRow = {
  name: string;
  value: number;
  display: string;
  hint?: string;
};

export function PeakTracks({
  rows,
  accent = "hsl(var(--chart-5))",
}: {
  rows: TrackRow[];
  accent?: string;
}) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((row) => row.value), 1);
  const peak = rows.reduce((best, row) => (row.value > best.value ? row : best), rows[0]);
  return (
    <ul className="space-y-2">
      {rows.map((row) => {
        const hot = peak != null && row.name === peak.name && row.value === peak.value && row.value > 0;
        const width = Math.max(row.value > 0 ? 8 : 0, (row.value / max) * 100);
        return (
          <li key={row.name} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium text-foreground">
                {row.name}
                {row.hint ? (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">{row.hint}</span>
                ) : null}
              </span>
              <span className="shrink-0 tabular-nums text-foreground">{row.display}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", hot ? "opacity-100" : "opacity-55")}
                style={{
                  width: `${width}%`,
                  background: accent,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function PeakTrackCard({
  title,
  value,
  chip,
  rows,
  accent,
}: {
  title: string;
  value?: string;
  chip?: string;
  rows: TrackRow[];
  accent?: string;
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
        <CardTitle className="min-w-0 text-sm font-semibold leading-5">{title}</CardTitle>
        {value ? (
          <p className="shrink-0 text-lg font-semibold tabular-nums tracking-tight">{value}</p>
        ) : chip ? (
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
            {chip}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="p-4 pt-1">
        {rows.every((row) => row.value <= 0) ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Bu dönemde tutar yok.</p>
        ) : (
          <PeakTracks rows={rows} accent={accent} />
        )}
      </CardContent>
    </Card>
  );
}
