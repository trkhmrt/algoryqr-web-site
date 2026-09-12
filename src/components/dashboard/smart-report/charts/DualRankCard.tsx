"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DualRankCard({
  title,
  leftTitle,
  rightTitle,
  left,
  right,
  leftValue = "Adet",
  rightValue = "Ciro",
  footer,
}: {
  title: string;
  leftTitle: string;
  rightTitle: string;
  left: { name: string; value: string; weight?: number }[];
  right: { name: string; value: string; weight?: number }[];
  leftValue?: string;
  rightValue?: string;
  footer?: string;
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold leading-5">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-1">
        <div className="grid gap-4 sm:grid-cols-2">
          <RankColumn title={leftTitle} valueLabel={leftValue} items={left} accent="hsl(var(--chart-2))" />
          <RankColumn title={rightTitle} valueLabel={rightValue} items={right} accent="hsl(var(--chart-5))" />
        </div>
        {footer ? <p className="border-t border-border/60 pt-3 text-xs text-muted-foreground">{footer}</p> : null}
      </CardContent>
    </Card>
  );
}

function RankColumn({
  title,
  valueLabel,
  items,
  accent,
}: {
  title: string;
  valueLabel: string;
  items: { name: string; value: string; weight?: number }[];
  accent: string;
}) {
  const max = Math.max(...items.map((item) => item.weight ?? 0), 1);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{title}</span>
        <span>{valueLabel}</span>
      </div>
      <ul className="space-y-2.5">
        {items.map((item, index) => {
          const width = item.weight != null ? Math.max(8, (item.weight / max) * 100) : 0;
          return (
            <li key={`${item.name}-${index}`} className="space-y-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-foreground">
                  {index + 1}. {item.name}
                </span>
                <span className="shrink-0 tabular-nums text-foreground">{item.value}</span>
              </div>
              {item.weight != null ? (
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${width}%`, background: accent }} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
