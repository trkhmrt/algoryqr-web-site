"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { CHART_COLORS } from "../chart-config";
import { TrendBadge } from "../ReportChartCard";
import { FadeLineSpark } from "./FadeLineSpark";

export type KpiStat = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  progress?: number;
  trend?: number | null;
  color?: string;
  spark?: number[];
};

export function KpiStatCards({ items }: { items: KpiStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <TrendBadge value={item.trend} />
            </div>
            <p className="text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">
              {item.value}
            </p>
            {item.spark && item.spark.length >= 2 ? (
              <FadeLineSpark
                values={item.spark}
                color={item.color ?? CHART_COLORS.c1}
                className="-mx-1"
              />
            ) : item.progress != null ? (
              <Progress
                value={Math.max(4, Math.min(100, item.progress))}
                className="h-1.5"
              />
            ) : null}
            {item.hint ? (
              <p className={cn("text-xs text-muted-foreground")}>{item.hint}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
