"use client";

import { Label, PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart";

import { PeakTracks, type TrackRow } from "./NestedRingCard";

export function RemainSplitCard({
  title,
  percent,
  center,
  caption,
  rows,
}: {
  title: string;
  percent: number;
  center: string;
  caption: string;
  rows: TrackRow[];
}) {
  const p = Math.max(0, Math.min(100, percent));
  const config = {
    value: { label: caption, color: "hsl(var(--chart-4))" },
  } satisfies ChartConfig;

  return (
    <Card className="rounded-2xl">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold leading-5">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid items-center gap-4 p-4 pt-1 sm:grid-cols-[148px_1fr]">
        <ChartContainer config={config} className="mx-auto aspect-square h-[148px] w-[148px]">
          <RadialBarChart
            data={[{ name: "value", value: p, fill: "var(--color-value)" }]}
            startAngle={90}
            endAngle={-270}
            innerRadius="72%"
            outerRadius="100%"
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" background={{ fill: "hsl(var(--muted))" }} cornerRadius={12} />
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 6} className="fill-foreground text-sm font-semibold">
                      {center}
                    </tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 14} className="fill-muted-foreground text-[11px]">
                      {caption}
                    </tspan>
                  </text>
                );
              }}
            />
          </RadialBarChart>
        </ChartContainer>
        <PeakTracks rows={rows} accent="hsl(var(--chart-4))" />
      </CardContent>
    </Card>
  );
}
