"use client";

import Link from "next/link";
import { Clock3 } from "lucide-react";

import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { formatDaysUntilExpiry } from "@/lib/package-display";
import type { TrialReminderInfo } from "@/lib/trial-reminder";
import { cn } from "@/lib/utils";

interface TrialReminderBadgeProps {
  info: TrialReminderInfo;
  compact?: boolean;
}

export default function TrialReminderBadge({ info, compact = false }: TrialReminderBadgeProps) {
  return (
    <Link
      href={DASHBOARD_ROUTES.accountPackages}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-500/15 dark:text-amber-400",
        compact && "max-w-[9.5rem] sm:max-w-none",
      )}
      title={`${info.packageName} denemeniz · ${formatDaysUntilExpiry(info.daysUntilExpiry)}`}
    >
      <Clock3 className="h-3 w-3 shrink-0" />
      <span className="truncate">
        {compact
          ? formatDaysUntilExpiry(info.daysUntilExpiry)
          : `Deneme · ${formatDaysUntilExpiry(info.daysUntilExpiry)}`}
      </span>
    </Link>
  );
}
