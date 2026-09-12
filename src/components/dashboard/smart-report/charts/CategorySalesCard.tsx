"use client";

import { Clock } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import type { CategorySlice } from "../shadcn-spark";
import { DeltaText } from "./DeltaPill";

const TONES = [
  "hsl(var(--foreground))",
  "hsl(var(--foreground) / 0.72)",
  "hsl(var(--foreground) / 0.44)",
  "hsl(var(--foreground) / 0.22)",
  "hsl(var(--muted-foreground))",
];

export function CategorySalesCard({
  title,
  compact,
  delta,
  slices,
}: {
  title: string;
  compact: string;
  delta: number | null;
  slices: CategorySlice[];
}) {
  const config: ChartConfig = {};
  const chartData = slices.map((slice, index) => {
    const key = `s${index}`;
    config[key] = { label: slice.name, color: TONES[index % TONES.length] };
    return { ...slice, fill: `var(--color-${key})`, key };
  });

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1 p-5 pb-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {title}
        </div>
        <DeltaText value={delta} suffix="önceki döneme göre" />
      </CardHeader>
      <CardContent className="grid items-center gap-4 p-5 pt-2 sm:grid-cols-[160px_1fr]">
        {chartData.length === 0 ? (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Bu dönemde pay yok.</p>
        ) : (
          <>
            <ChartContainer config={config} className="mx-auto aspect-square h-[148px] w-[148px]">
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="name" hideLabel indicator="dot" />}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={68}
                  strokeWidth={0}
                  paddingAngle={0}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 6} className="fill-foreground text-lg font-semibold">
                            {compact}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 12} className="fill-muted-foreground text-[11px]">
                            Toplam
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="space-y-2.5">
              {slices.map((slice, index) => (
                <li key={slice.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: TONES[index % TONES.length] }}
                    />
                    <span className="truncate text-muted-foreground">{slice.name}</span>
                  </span>
                  <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                    <span className="font-medium text-foreground">{slice.display}</span>
                    <span className="w-8 text-right text-xs text-muted-foreground">{slice.percent}%</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
