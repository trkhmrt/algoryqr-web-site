"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { MenuRevenueReportResponse } from "@/lib/api";

import { readCiroMetrics } from "../ciro-metrics";
import { buildPulseArea, compactAxis, pulseRadioLabels } from "../shadcn-charts";

export function TodayPulseCard({
  current,
  previous,
  money,
}: {
  current: MenuRevenueReportResponse;
  previous?: MenuRevenueReportResponse;
  money: (value: number) => string;
}) {
  const metrics = readCiroMetrics(current);
  const labels = pulseRadioLabels(current.from, current.to);
  const points = buildPulseArea(current, previous);
  const config = {
    current: { label: labels.current, color: "hsl(var(--foreground))" },
    previous: { label: labels.previous, color: "hsl(var(--muted-foreground))" },
  } satisfies ChartConfig;

  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-5 pb-2">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
            {money(metrics.total)}
          </CardTitle>
          <CardDescription>
            Ciro · {metrics.orders.toLocaleString("tr-TR")} sipariş
          </CardDescription>
        </div>
        <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
          <LegendSwatch className="bg-foreground" label={labels.current} />
          <LegendSwatch className="bg-muted-foreground" label={labels.previous} />
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-2">
        <ChartContainer config={config} className="aspect-auto h-[220px] w-full sm:h-[260px]">
          <AreaChart accessibilityLayer data={points} margin={{ left: 8, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="pulse-current" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-current)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--color-current)" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 6" className="stroke-border/50" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={24}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              domain={[0, "auto"]}
              tick={{ fontSize: 11 }}
              tickFormatter={compactAxis}
            />
            <ChartTooltip
              cursor={{ stroke: "hsl(var(--border))" }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value, name) => (
                    <>
                      <span className="text-muted-foreground">
                        {name === "previous" ? labels.previous : labels.current}
                      </span>
                      <span className="ml-auto font-medium tabular-nums text-foreground">
                        {money(Number(value ?? 0))}
                      </span>
                    </>
                  )}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="previous"
              stroke="var(--color-previous)"
              strokeWidth={1.5}
              fill="transparent"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="current"
              stroke="var(--color-current)"
              strokeWidth={2}
              fill="url(#pulse-current)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <ChartLegend content={<ChartLegendContent className="sm:hidden" />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${className}`} />
      {label}
    </span>
  );
}
