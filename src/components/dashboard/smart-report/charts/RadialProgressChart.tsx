"use client";

import { Label, PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";

import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";

import { ReportChartCard } from "../ReportChartCard";

export function RadialProgressChart({
  title,
  description,
  percent,
  centerLabel,
  color = "hsl(var(--chart-4))",
}: {
  title: string;
  description?: string;
  percent: number;
  centerLabel?: string;
  color?: string;
}) {
  const p = Math.max(0, Math.min(100, percent));
  const config = {
    value: { label: title, color },
  } satisfies ChartConfig;
  const data = [{ name: "value", value: p, fill: "var(--color-value)" }];

  return (
    <ReportChartCard title={title} description={description}>
      <ChartContainer config={config} className="mx-auto aspect-square max-h-[200px]">
        <RadialBarChart
          data={data}
          startAngle={90}
          endAngle={-270}
          innerRadius="68%"
          outerRadius="100%"
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            dataKey="value"
            background={{ fill: "hsl(var(--muted))" }}
            cornerRadius={10}
          />
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
              return (
                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 4} className="fill-foreground text-3xl font-bold">
                    {p.toFixed(0)}%
                  </tspan>
                  {centerLabel ? (
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 16}
                      className="fill-muted-foreground text-xs"
                    >
                      {centerLabel}
                    </tspan>
                  ) : null}
                </text>
              );
            }}
          />
        </RadialBarChart>
      </ChartContainer>
    </ReportChartCard>
  );
}

export function SegmentProgressCard({
  title,
  description,
  leftLabel,
  rightLabel,
  segments,
}: {
  title: string;
  description?: string;
  leftLabel: string;
  rightLabel: string;
  segments: { label: string; percent: number; color: string }[];
}) {
  return (
    <ReportChartCard title={title} description={description}>
      <div className="mb-3 flex justify-between text-sm font-medium">
        <span>{leftLabel}</span>
        <span className="text-muted-foreground">{rightLabel}</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-secondary">
        {segments
          .filter((s) => s.percent > 0)
          .map((s) => (
            <div
              key={s.label}
              className="h-full"
              style={{ width: `${Math.max(3, s.percent)}%`, background: s.color }}
              title={`${s.label} %${s.percent.toFixed(0)}`}
            />
          ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {segments.map((s) => (
          <li key={s.label}>
            <Badge variant="outline" className="gap-1.5 font-normal">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}
              <span className="font-semibold tabular-nums">%{s.percent.toFixed(0)}</span>
            </Badge>
          </li>
        ))}
      </ul>
    </ReportChartCard>
  );
}

export function RankListCard({
  title,
  description,
  items,
}: {
  title: string;
  description?: string;
  items: { name: string; value: string; active?: boolean; share?: number }[];
}) {
  return (
    <ReportChartCard title={title} description={description}>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={`${item.name}-${i}`} className="rounded-lg border bg-card px-3 py-2.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <Badge variant={item.active ? "default" : "secondary"} className="h-5 w-5 justify-center p-0">
                  {i + 1}
                </Badge>
                <span className="truncate font-medium">{item.name}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{item.value}</span>
            </div>
            {item.share != null ? (
              <Progress value={Math.max(4, Math.min(100, item.share))} className="mt-2 h-1.5" />
            ) : null}
          </li>
        ))}
      </ul>
    </ReportChartCard>
  );
}

export function FunnelStepsCard({
  title,
  description,
  stages,
}: {
  title: string;
  description?: string;
  stages: { label: string; value: number }[];
}) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  return (
    <ReportChartCard title={title} description={description}>
      <div className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.label} className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-muted-foreground">{stage.label}</span>
              <span className="font-semibold tabular-nums">
                {stage.value.toLocaleString("tr-TR")}
              </span>
            </div>
            <Progress value={Math.max(6, (stage.value / max) * 100)} className="h-2" />
          </div>
        ))}
      </div>
    </ReportChartCard>
  );
}
