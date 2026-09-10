"use client";

import BranchReportDashboard from "@/components/dashboard/smart-report/BranchReportDashboard";
import { useBranchAnalyticsReport } from "@/hooks/use-branch-analytics-report";
import { useBranchRevenueReport } from "@/hooks/use-branch-revenue-report";
import { useBranchWaiterPerformanceReport } from "@/hooks/use-branch-waiter-performance-report";
import type { SmartReportResult } from "@/lib/smart-report";

export default function BranchSmartReportStory({
  branchId,
  from,
  to,
  branchName,
  result,
  compact,
}: {
  branchId: number;
  from: string;
  to: string;
  branchName?: string | null;
  result: SmartReportResult | null;
  compact?: boolean;
}) {
  const visitQuery = useBranchAnalyticsReport(branchId, null, from, to, true);
  const revenueQuery = useBranchRevenueReport(branchId, null, from, to, true);
  const waiterQuery = useBranchWaiterPerformanceReport(
    branchId,
    null,
    from,
    to,
    !compact,
  );

  const leader = [...(revenueQuery.data?.channels ?? [])].sort(
    (a, b) => Number(b.revenue ?? 0) - Number(a.revenue ?? 0),
  )[0];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Şube akıllı raporu
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
          {result?.title || branchName || "Dashboard"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {from} – {to}
          {leader ? ` · Lider kanal: ${leader.label}` : ""}
        </p>
      </div>

      <BranchReportDashboard
        revenue={revenueQuery.data}
        visits={visitQuery.data}
        waiter={waiterQuery.data}
        result={result}
        compact={compact}
        loading={revenueQuery.isLoading || visitQuery.isLoading}
      />
    </div>
  );
}
