"use client";

import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ReportChartCard({
  title,
  description,
  action,
  footer,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn(className)}>
      {(title || description || action) && (
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="min-w-0 space-y-1">
            {title ? <CardTitle className="text-base">{title}</CardTitle> : null}
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </CardHeader>
      )}
      <CardContent className={cn(!(title || description || action) && "pt-6")}>
        {children}
      </CardContent>
      {footer ? (
        <CardFooter className="text-sm text-muted-foreground">{footer}</CardFooter>
      ) : null}
    </Card>
  );
}

export function TrendBadge({ value }: { value: number | null | undefined }) {
  if (value == null || Number.isNaN(value)) return null;
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1 font-semibold tabular-nums",
        up
          ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
          : "bg-destructive/10 text-destructive hover:bg-destructive/10",
      )}
    >
      {up ? "+" : ""}
      {value.toFixed(1)}%
      <Icon className="h-3 w-3" />
    </Badge>
  );
}

export function ReportEmpty({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        {text}
      </CardContent>
    </Card>
  );
}

export function ReportSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i}>
          <CardContent className="space-y-3 pt-6">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
