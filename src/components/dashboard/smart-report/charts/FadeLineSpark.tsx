"use client";

import { useId } from "react";
import { Area, AreaChart } from "recharts";

import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

import { CHART_COLORS } from "../chart-config";

export function FadeLineSpark({
  values,
  color = CHART_COLORS.c1,
  className,
}: {
  values: number[];
  color?: string;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const strokeId = `spark-stroke-${uid}`;
  const fillId = `spark-fill-${uid}`;

  if (values.length < 2) return null;

  const data = values.map((value, i) => ({ i, value }));
  const config = {
    value: { label: "trend", color },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={config}
      className={cn(
        "aspect-auto h-10 w-full [mask-image:linear-gradient(90deg,transparent_0%,black_22%,black_100%)]",
        className,
      )}
    >
      <AreaChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
        <defs>
          <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="55%" stopColor={color} stopOpacity={0.75} />
            <stop offset="100%" stopColor={color} stopOpacity={1} />
          </linearGradient>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={`url(#${strokeId})`}
          fill={`url(#${fillId})`}
          strokeWidth={1.75}
          isAnimationActive={false}
          dot={false}
          activeDot={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
