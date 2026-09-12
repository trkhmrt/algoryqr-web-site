"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

import { CHART_COLORS } from "../chart-config";

const W = 320;
const H = 72;
const PAD_X = 14;
const PAD_Y = 12;

type Pt = { x: number; y: number };

export function paddedSparkSeries(values: number[]): number[] {
  if (values.length >= 2) return values;
  if (values.length === 1) return [values[0], values[0]];
  return [];
}

function sparkPoints(values: number[]): Pt[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const last = values.length - 1;
  return values.map((value, index) => ({
    x: PAD_X + (index / last) * (W - PAD_X * 2),
    y: H - PAD_Y - ((value - min) / span) * (H - PAD_Y * 2),
  }));
}

function sparkLine(points: Pt[]): string {
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function sparkArea(points: Pt[], line: string): string {
  const first = points[0];
  const last = points[points.length - 1];
  return `${line} L ${last.x} ${H} L ${first.x} ${H} Z`;
}

export function MiniLineSpark({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const series = paddedSparkSeries(values);
  if (series.length < 2) return null;
  const line = sparkLine(sparkPoints(series));
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("h-12 w-full", className)}
      aria-hidden
    >
      <path
        d={line}
        fill="none"
        stroke="hsl(var(--foreground))"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

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
  if (values.length < 2) return null;

  const points = sparkPoints(values);
  const line = sparkLine(points);
  const last = points[points.length - 1];
  const strokeId = `spark-stroke-${uid}`;
  const fillId = `spark-fill-${uid}`;
  const maskGradId = `spark-mask-grad-${uid}`;
  const maskId = `spark-mask-${uid}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("h-10 w-full overflow-visible", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="22%" stopColor={color} stopOpacity="0.2" />
          <stop offset="62%" stopColor={color} stopOpacity="0.75" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={maskGradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="24%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="1" />
        </linearGradient>
        <mask id={maskId}>
          <rect width={W} height={H} fill={`url(#${maskGradId})`} />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        <path d={sparkArea(points, line)} fill={`url(#${fillId})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.14"
        />
        <path
          d={line}
          fill="none"
          stroke={`url(#${strokeId})`}
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <circle cx={last.x} cy={last.y} r="7" fill={color} opacity="0.18" />
      <circle cx={last.x} cy={last.y} r="3.25" fill={color} />
    </svg>
  );
}
