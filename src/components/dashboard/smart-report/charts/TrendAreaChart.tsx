"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { ReportChartCard, TrendBadge } from "../ReportChartCard";
import { seriesConfig } from "../chart-config";

export function TrendAreaChart({
  title,
  description,
  value,
  trend,
  data,
  series,
  heightClass = "h-[200px] sm:h-[240px]",
  className,
}: {
  title: string;
  description?: string;
  value?: string;
  trend?: number | null;
  data: Record<string, string | number>[];
  series: { key: string; label: string; color?: string; dashed?: boolean }[];
  heightClass?: string;
  className?: string;
}) {
  const config: ChartConfig = seriesConfig(series);

  return (
    <ReportChartCard
      className={className}
      title={title}
      description={description}
      action={<TrendBadge value={trend} />}
      footer={value ? <span className="font-medium text-foreground">{value}</span> : undefined}
    >
      <ChartContainer config={config} className={`aspect-auto w-full ${heightClass}`}>
        <AreaChart accessibilityLayer data={data} margin={{ left: 4, right: 4, top: 8 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={`var(--color-${s.key})`} stopOpacity={s.dashed ? 0 : 0.32} />
                <stop offset="100%" stopColor={`var(--color-${s.key})`} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 6" className="stroke-border/50" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            tick={{ fontSize: 11 }}
          />
          <YAxis tickLine={false} axisLine={false} width={40} tick={{ fontSize: 11 }} />
          <ChartTooltip cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "4 4" }} content={<ChartTooltipContent indicator="line" />} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={`var(--color-${s.key})`}
              fill={s.dashed ? "transparent" : `url(#fill-${s.key})`}
              strokeWidth={2.25}
              strokeDasharray={s.dashed ? "5 4" : undefined}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
          {series.length > 1 ? <ChartLegend content={<ChartLegendContent />} /> : null}
        </AreaChart>
      </ChartContainer>
    </ReportChartCard>
  );
}
