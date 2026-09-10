"use client";

import { useMemo } from "react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { ReportChartCard, ReportEmpty } from "../ReportChartCard";

export function RadarCompareChart({
  title,
  description,
  axes,
  series,
}: {
  title: string;
  description?: string;
  axes: string[];
  series: { name: string; values: number[]; color?: string }[];
}) {
  const keyed = series.slice(0, 3).map((s, i) => ({
    ...s,
    key: `s${i}`,
  }));

  const config = useMemo(() => {
    const cfg: ChartConfig = {};
    keyed.forEach((s, i) => {
      cfg[s.key] = {
        label: s.name,
        color: s.color ?? `hsl(var(--chart-${(i % 5) + 1}))`,
      };
    });
    return cfg;
  }, [keyed]);

  const data = axes.map((axis, i) => {
    const row: Record<string, string | number> = { axis };
    keyed.forEach((s) => {
      row[s.key] = s.values[i] ?? 0;
    });
    return row;
  });

  if (keyed.length === 0) {
    return <ReportEmpty text="Personel kıyas verisi yok." />;
  }

  return (
    <ReportChartCard title={title} description={description}>
      <ChartContainer config={config} className="mx-auto aspect-square max-h-[280px]">
        <RadarChart data={data}>
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <PolarAngleAxis dataKey="axis" />
          <PolarGrid />
          {keyed.map((s) => (
            <Radar
              key={s.key}
              dataKey={s.key}
              fill={`var(--color-${s.key})`}
              fillOpacity={0.18}
              stroke={`var(--color-${s.key})`}
              strokeWidth={2}
            />
          ))}
          <ChartLegend content={<ChartLegendContent />} />
        </RadarChart>
      </ChartContainer>
    </ReportChartCard>
  );
}
