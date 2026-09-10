"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { ReportChartCard, ReportEmpty } from "../ReportChartCard";
import { seriesConfig } from "../chart-config";

export function StackedBarChart({
  title,
  description,
  data,
  series,
  stacked = true,
}: {
  title: string;
  description?: string;
  data: Record<string, string | number>[];
  series: { key: string; label: string; color?: string }[];
  stacked?: boolean;
}) {
  const config: ChartConfig = seriesConfig(series);

  if (data.length === 0 || series.length === 0) {
    return <ReportEmpty text="Karşılaştırma verisi yok." />;
  }

  return (
    <ReportChartCard title={title} description={description}>
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
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
            content={<ChartTooltipContent />}
          />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId={stacked ? "a" : undefined}
              fill={`var(--color-${s.key})`}
              radius={
                stacked && i === series.length - 1
                  ? [5, 5, 0, 0]
                  : stacked
                    ? [0, 0, 0, 0]
                    : [5, 5, 2, 2]
              }
              maxBarSize={stacked ? 32 : 24}
            />
          ))}
          <ChartLegend content={<ChartLegendContent />} />
        </BarChart>
      </ChartContainer>
    </ReportChartCard>
  );
}
