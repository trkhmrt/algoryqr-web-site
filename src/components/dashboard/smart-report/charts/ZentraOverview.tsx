"use client";

import { useMemo } from "react";
import { ArrowRight, TrendingDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { FadeLineSpark } from "./FadeLineSpark";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { CHART_COLORS } from "../chart-config";
import { TrendBadge } from "../ReportChartCard";

export type FunnelStage = {
  label: string;
  value: number;
};

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("tr-TR");
}

export function DropoffFunnelChart({
  title = "Sipariş hunisi",
  description,
  stages,
  exploreHint,
}: {
  title?: string;
  description?: string;
  stages: FunnelStage[];
  exploreHint?: string;
}) {
  const first = stages[0]?.value ?? 0;
  const max = Math.max(...stages.map((s) => s.value), 1);

  const enriched = useMemo(() => {
    return stages.map((stage, i) => {
      const prev = i === 0 ? stage.value : stages[i - 1].value;
      const stepConversion = prev > 0 ? (stage.value / prev) * 100 : 100;
      const overall = first > 0 ? (stage.value / first) * 100 : 100;
      const lost = i === 0 ? 0 : Math.max(0, prev - stage.value);
      return { ...stage, stepConversion, overall, lost };
    });
  }, [stages, first]);

  const overall =
    first > 0 && stages.length > 1
      ? (stages[stages.length - 1].value / first) * 100
      : 100;

  const chartConfig = {
    value: { label: "Değer", color: "hsl(var(--chart-1))" },
  } satisfies ChartConfig;

  const chartData = enriched.map((s) => ({
    label: s.label,
    value: s.value,
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        <Badge variant="secondary" className="tabular-nums">
          Uçtan uca %{overall.toFixed(0)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {enriched.map((stage, i) => (
            <Card key={stage.label} className="shadow-none">
              <CardContent className="space-y-2 p-3">
                <p className="truncate text-xs text-muted-foreground">{stage.label}</p>
                <p className="text-xl font-semibold tabular-nums tracking-tight">
                  {formatCompact(stage.value)}
                </p>
                <Progress value={Math.max(4, (stage.value / max) * 100)} className="h-1.5" />
                <div className="flex flex-wrap items-center gap-1">
                  {i === 0 ? (
                    <Badge variant="outline" className="text-[10px]">
                      Başlangıç
                    </Badge>
                  ) : (
                    <>
                      <Badge
                        variant={stage.stepConversion < 55 ? "destructive" : "secondary"}
                        className="text-[10px] tabular-nums"
                      >
                        %{stage.stepConversion.toFixed(0)}
                      </Badge>
                      {stage.lost > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <TrendingDown className="h-3 w-3 text-destructive" />
                          −{formatCompact(stage.lost)}
                        </span>
                      ) : null}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <ChartContainer config={chartConfig} className="aspect-auto h-[180px] w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
            <YAxis tickLine={false} axisLine={false} width={36} tick={{ fontSize: 11 }} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.label}
                  fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      {exploreHint ? (
        <CardFooter className="border-t pt-4 text-sm text-muted-foreground">
          <ArrowRight className="mr-2 h-4 w-4 shrink-0 text-primary" />
          <span>{exploreHint}</span>
        </CardFooter>
      ) : null}
    </Card>
  );
}

export function GrossVolumeCard({
  title = "Brüt ciro",
  value,
  trend,
  rows,
}: {
  title?: string;
  value: string;
  trend?: number | null;
  rows: { label: string; value: string; percent: number; color: string }[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
          <TrendBadge value={trend} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium tabular-nums">
                {row.value}
                <Badge variant="outline" className="ml-2 tabular-nums">
                  %{Math.round(row.percent)}
                </Badge>
              </span>
            </div>
            <Progress value={Math.max(4, Math.min(100, row.percent))} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RetentionStepChart({
  title = "Günlük ritim",
  data,
  peakLabel,
}: {
  title?: string;
  data: { label: string; value: number }[];
  peakLabel?: string;
}) {
  const config = {
    value: { label: title, color: CHART_COLORS.c5 },
  } satisfies ChartConfig;
  const peak = data.reduce(
    (best, row) => (row.value > best.value ? row : best),
    data[0] ?? { label: "", value: 0 },
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {peakLabel || peak.value > 0 ? (
          <CardDescription>
            Zirve: {peakLabel ?? `${peak.label} · ${peak.value.toLocaleString("tr-TR")}`}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-[180px] w-full">
          <BarChart accessibilityLayer data={data} margin={{ left: 4, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tick={{ fontSize: 11 }}
            />
            <YAxis hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function InsightHighlightCard({
  percent,
  title,
  body,
  progress = 75,
}: {
  percent: string;
  title: string;
  body: string;
  progress?: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>Dönüşüm</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{percent}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm font-medium leading-snug">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
        <Separator />
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Oran</span>
            <span className="tabular-nums">%{Math.round(progress)}</span>
          </div>
          <Progress value={Math.max(8, Math.min(100, progress))} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricTile({
  label,
  value,
  hint,
  trend,
  spark,
  sparkColor = CHART_COLORS.c1,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: number | null;
  spark?: number[];
  sparkColor?: string;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="space-y-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-muted-foreground">{label}</p>
          <TrendBadge value={trend} />
        </div>
        <p className="text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">{value}</p>
        {spark && spark.length >= 2 ? (
          <FadeLineSpark values={spark} color={sparkColor} className="-mx-1" />
        ) : null}
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
