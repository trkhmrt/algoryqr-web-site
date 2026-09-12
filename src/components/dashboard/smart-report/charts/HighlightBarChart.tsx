"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { ReportChartCard, TrendBadge } from "../ReportChartCard";

export function HighlightBarChart({
  title,
  description,
  value,
  trend,
  data,
  dataKey = "value",
  highlightMax = true,
  className,
}: {
  title: string;
  description?: string;
  value?: string;
  trend?: number | null;
  data: { label: string; value: number }[];
  dataKey?: string;
  highlightMax?: boolean;
  className?: string;
}) {
  const config = {
    [dataKey]: { label: title, color: "hsl(var(--chart-1))" },
  } satisfies ChartConfig;

  const hi = highlightMax
    ? data.reduce((best, row, i, arr) => (row.value > arr[best].value ? i : best), 0)
    : -1;

  return (
    <ReportChartCard
      className={className}
      title={title}
      description={description}
      action={<TrendBadge value={trend} />}
      footer={value ? <span className="font-medium text-foreground">{value}</span> : undefined}
    >
      <ChartContainer config={config} className="aspect-auto h-[200px] w-full sm:h-[240px]">
        <BarChart accessibilityLayer data={data} margin={{ left: 4, right: 4, top: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 6" className="stroke-border/50" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={20}
            tick={{ fontSize: 11 }}
          />
          <YAxis tickLine={false} axisLine={false} width={40} tick={{ fontSize: 11 }} />
          <ChartTooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.45 }}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar dataKey={dataKey} radius={[6, 6, 2, 2]} maxBarSize={40}>
            {data.map((entry, index) => (
              <Cell
                key={entry.label}
                fill={
                  index === hi
                    ? `var(--color-${dataKey})`
                    : "color-mix(in oklab, hsl(var(--chart-1)) 28%, hsl(var(--muted)))"
                }
                opacity={index === hi ? 1 : 0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </ReportChartCard>
  );
}

export function MiniBarSpark({
  title,
  value,
  trend,
  data,
}: {
  title: string;
  value: string;
  trend?: number | null;
  data: { label: string; value: number }[];
}) {
  const config = {
    value: { label: title, color: "hsl(var(--chart-1))" },
  } satisfies ChartConfig;

  return (
    <ReportChartCard title={title} action={<TrendBadge value={trend} />}>
      <p className="mb-3 text-2xl font-bold tracking-tight">{value}</p>
      <ChartContainer config={config} className="aspect-auto h-[96px] w-full">
        <BarChart accessibilityLayer data={data}>
          <XAxis dataKey="label" hide />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="value" fill="var(--color-value)" radius={[3, 3, 0, 0]} maxBarSize={10} />
        </BarChart>
      </ChartContainer>
    </ReportChartCard>
  );
}
