"use client";

import { useMemo } from "react";
import { Cell, Label, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { ReportChartCard, ReportEmpty } from "../ReportChartCard";

export function SharePieChart({
  title,
  description,
  center,
  data,
  formatValue,
}: {
  title: string;
  description?: string;
  center?: string;
  data: { name: string; value: number; color?: string }[];
  formatValue?: (n: number) => string;
}) {
  const filtered = data.filter((d) => d.value > 0);
  const total = filtered.reduce((sum, d) => sum + d.value, 0) || 1;

  const config = useMemo(() => {
    const cfg: ChartConfig = {};
    filtered.forEach((d, i) => {
      cfg[`s${i}`] = {
        label: d.name,
        color: d.color ?? `hsl(var(--chart-${(i % 5) + 1}))`,
      };
    });
    return cfg;
  }, [filtered]);

  const chartData = filtered.map((d, i) => ({
    name: d.name,
    value: d.value,
    fill: `var(--color-s${i})`,
    key: `s${i}`,
    share: (d.value / total) * 100,
  }));

  if (chartData.length === 0) {
    return <ReportEmpty text="Bu dönemde pay verisi yok." />;
  }

  return (
    <ReportChartCard title={title} description={description}>
      <ChartContainer config={config} className="mx-auto aspect-square max-h-[240px]">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                nameKey="name"
                hideLabel
                formatter={(value) =>
                  formatValue ? formatValue(Number(value)) : Number(value).toLocaleString("tr-TR")
                }
              />
            }
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={88}
            strokeWidth={3}
            stroke="hsl(var(--card))"
            paddingAngle={2}
          >
            {chartData.map((d) => (
              <Cell key={d.key} fill={d.fill} />
            ))}
            {center ? (
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) - 6}
                        className="fill-muted-foreground text-[10px]"
                      >
                        Toplam
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 12}
                        className="fill-foreground text-sm font-bold"
                      >
                        {center}
                      </tspan>
                    </text>
                  );
                }}
              />
            ) : null}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {filtered.map((d, i) => (
          <li
            key={d.name}
            className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs"
          >
            <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: d.color ?? `hsl(var(--chart-${(i % 5) + 1}))` }}
              />
              <span className="truncate font-medium text-foreground">{d.name}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-foreground">
              %{((d.value / total) * 100).toFixed(0)}
            </span>
          </li>
        ))}
      </ul>
    </ReportChartCard>
  );
}
