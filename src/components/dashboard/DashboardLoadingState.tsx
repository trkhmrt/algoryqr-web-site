"use client";

import { Loader2 } from "lucide-react";

import { DASHBOARD_PANEL } from "@/lib/dashboard-surface";
import { cn } from "@/lib/utils";

type DashboardLoadingStateProps = {
  label: string;
  className?: string;
};

export function DashboardLoadingState({ label, className }: DashboardLoadingStateProps) {
  return (
    <div className={cn(DASHBOARD_PANEL, "flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}
