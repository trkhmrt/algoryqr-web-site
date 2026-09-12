"use client";

import { useMemo } from "react";

import type { MenuRevenueReportResponse } from "@/lib/api";
import { useBranchRevenueReport } from "@/hooks/use-branch-revenue-report";
import { comparePeriodRange } from "@/reporting";

import { CHART_COLORS } from "./chart-config";
import { CategorySalesCard } from "./charts/CategorySalesCard";
import { DualRankCard } from "./charts/DualRankCard";
import { PeakTrackCard } from "./charts/NestedRingCard";
import { RemainSplitCard } from "./charts/RemainSplitCard";
import { SparkKpiStrip } from "./charts/SparkKpiStrip";
import { TodayPulseCard } from "./charts/TodayPulseCard";
import { TwinTrendCards } from "./charts/TwinTrendCards";
import {
  readChannelMix,
  readCiroMetrics,
  readProfitMix,
  readSoldMix,
  readVolumeValue,
} from "./ciro-metrics";
import { buildCategorySales, buildCiroSparkKpis, buildTwinTrends } from "./shadcn-spark";

export function CiroPage({
  revenue,
  money: m,
}: {
  revenue: MenuRevenueReportResponse;
  money: (value: number) => string;
}) {
  const compareRange = useMemo(
    () => comparePeriodRange(revenue.from, revenue.to, "previous"),
    [revenue.from, revenue.to],
  );
  const compareQuery = useBranchRevenueReport(
    revenue.branchId ?? null,
    revenue.menuId ?? null,
    compareRange.from,
    compareRange.to,
    revenue.branchId != null,
  );
  const previous = compareQuery.data;
  const metrics = readCiroMetrics(revenue);
  const channels = readChannelMix(revenue, metrics);
  const sold = readSoldMix(revenue);
  const volume = readVolumeValue(revenue);
  const profit = readProfitMix(revenue, metrics);
  const twins = buildTwinTrends(revenue, previous, m);
  const sparks = buildCiroSparkKpis(revenue, previous, m);
  const categories = buildCategorySales(revenue, previous, m);

  return (
    <div className="space-y-3">
      <SparkKpiStrip items={sparks} />
      <TodayPulseCard current={revenue} previous={previous} money={m} />
      <TwinTrendCards left={twins[0]} right={twins[1]} />
      <div className="grid gap-3 xl:grid-cols-2">
        <RemainSplitCard
          title="Kasada kalan"
          percent={profit.netShare}
          center={m(profit.net)}
          caption="kasada kalan"
          rows={[
            { name: "Brüt satış", value: profit.gross, display: m(profit.gross) },
            { name: "Sabit gider", value: profit.expense, display: m(profit.expense) },
            { name: "Kasada kalan", value: profit.net, display: m(profit.net) },
          ]}
        />
        <CategorySalesCard
          title="Kategori"
          compact={categories.compact}
          delta={categories.delta}
          slices={categories.slices}
        />
      </div>
      <PeakTrackCard
        title="Kanal"
        value={m(channels.total)}
        rows={channels.rows.map((row) => ({
          name: row.label,
          value: row.revenue,
          display: m(row.revenue),
          hint: `${row.orders.toLocaleString("tr-TR")} sipariş`,
        }))}
        accent={CHART_COLORS.c1}
      />
      <PeakTrackCard
        title="Satılanlar"
        value={`${sold.itemCount.toLocaleString("tr-TR")} adet`}
        rows={sold.products.slice(0, 8).map((row) => ({
          name: row.name,
          value: row.quantity,
          display: `${row.quantity.toLocaleString("tr-TR")} adet`,
          hint: m(row.revenue),
        }))}
        accent={CHART_COLORS.c2}
      />
      <DualRankCard
        title="Adet / ciro"
        leftTitle="Ürün"
        rightTitle="Ürün"
        left={volume.byQuantity.map((row) => ({
          name: row.name,
          value: row.quantity.toLocaleString("tr-TR"),
          weight: row.quantity,
        }))}
        right={volume.byRevenue.map((row) => ({
          name: row.name,
          value: m(row.revenue),
          weight: row.revenue,
        }))}
        footer={volumeFooter(volume)}
      />
    </div>
  );
}

function volumeFooter(volume: ReturnType<typeof readVolumeValue>): string {
  const bits: string[] = [];
  if (volume.leastSold) {
    bits.push(`En az satan: ${volume.leastSold.name} (${volume.leastSold.quantity} adet)`);
  }
  bits.push(`Satılmayan ürün: ${volume.unsoldCount}`);
  return bits.join(" · ");
}
