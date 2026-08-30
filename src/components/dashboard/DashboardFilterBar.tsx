"use client";

import type { ReactNode } from "react";

import { DASHBOARD_FILTER_BAR } from "@/lib/dashboard-surface";
import { cn } from "@/lib/utils";

type DashboardFilterBarProps = {
  children: ReactNode;
  className?: string;
};

export function DashboardFilterBar({ children, className }: DashboardFilterBarProps) {
  return (
    <div className={cn(DASHBOARD_FILTER_BAR, className)}>
      {children}
    </div>
  );
}
