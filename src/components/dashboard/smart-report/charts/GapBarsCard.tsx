"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GapBarsCard({
  title,
  leftLabel,
  rightLabel,
  rows,
}: {
  title: string;
  leftLabel: string;
  rightLabel: string;
  rows: { name: string; left: number; right: number }[];
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold leading-5">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-1">
        <div className="flex justify-end gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[hsl(var(--chart-1))]" />
            {leftLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[hsl(var(--chart-2))]" />
            {rightLabel}
          </span>
        </div>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Bu dönemde kayıt yok.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.name} className="space-y-1.5">
                <p className="truncate text-sm font-medium text-foreground">{row.name}</p>
                <ShareTrack percent={row.left} fill="hsl(var(--chart-1))" />
                <ShareTrack percent={row.right} fill="hsl(var(--chart-2))" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ShareTrack({
  percent,
  fill,
}: {
  percent: number;
  fill: string;
}) {
  const width = Math.max(percent > 0 ? 6 : 0, Math.min(100, percent));
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: fill }} />
      </div>
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-foreground">%{Math.round(percent)}</span>
    </div>
  );
}
