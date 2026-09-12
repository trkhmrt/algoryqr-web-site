"use client";

import { Line, LineChart, XAxis } from "recharts";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import type { TwinSeries } from "../shadcn-spark";
import { DeltaPill } from "./DeltaPill";

const CONFIG = {
  value: { label: "Değer", color: "hsl(var(--foreground))" },
} satisfies ChartConfig;

export function TwinTrendCards({
  left,
  right,
}: {
  left: TwinSeries;
  right: TwinSeries;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <TwinCard series={left} />
      <TwinCard series={right} />
    </div>
  );
}

function TwinCard({ series }: { series: TwinSeries }) {
  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardHeader className="space-y-2 p-5 pb-2">
        <p className="text-sm text-muted-foreground">{series.title}</p>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-2xl font-semibold tabular-nums tracking-tight">{series.value}</p>
          <DeltaPill value={series.delta} />
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-1">
        <ChartContainer
          config={CONFIG}
          className="aspect-auto h-[88px] w-full min-w-0 [&_.recharts-responsive-container]:h-full [&_.recharts-responsive-container]:w-full"
        >
          <LineChart data={series.points} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={20}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel indicator="line" />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
