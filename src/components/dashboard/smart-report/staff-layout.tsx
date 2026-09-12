"use client";

import type { MenuWaiterPerformanceReportResponse } from "@/lib/api";
import { toAmount } from "@/reporting/numbers";

import { GapBarsCard } from "./charts/GapBarsCard";
import { SparkKpiStrip } from "./charts/SparkKpiStrip";
import { buildStaffSparkKpis } from "./shadcn-spark";
import { readStaffCompare } from "./staff-metrics";

export function StaffPage({
  waiter,
  money: m,
}: {
  waiter: MenuWaiterPerformanceReportResponse;
  money: (value: number) => string;
}) {
  const mix = readStaffCompare(waiter);
  const revenueSeries = (waiter.daily ?? []).map((row) => toAmount(row.revenue));

  return (
    <div className="space-y-3">
      <SparkKpiStrip
        items={buildStaffSparkKpis(
          mix.totalRevenue,
          mix.totalTip,
          mix.teamItems,
          mix.avgItemRevenue,
          m,
          revenueSeries,
        )}
      />
      <GapBarsCard
        title="Ciro / sipariş"
        leftLabel="Ciro"
        rightLabel="Sipariş"
        rows={mix.load.slice(0, 8).map((row) => ({
          name: row.name,
          left: row.revenueShare,
          right: row.orderShare,
        }))}
      />
    </div>
  );
}
