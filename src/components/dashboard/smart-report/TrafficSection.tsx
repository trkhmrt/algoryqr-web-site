"use client";

import { useMemo, useState } from "react";

import type { MenuAnalyticsReportResponse, MenuRevenueReportResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

import { HighlightBarChart } from "./charts/HighlightBarChart";
import { RankListCard } from "./charts/RadialProgressChart";
import { SparkKpiStrip } from "./charts/SparkKpiStrip";
import { TwinTrendCards } from "./charts/TwinTrendCards";
import {
  DropoffFunnelChart,
  GrossVolumeCard,
  InsightHighlightCard,
  RetentionStepChart,
} from "./charts/ZentraOverview";
import { buildTrafficSparkKpis } from "./shadcn-spark";
import { buildTrafficView } from "./traffic-view";

export default function TrafficSection({
  visits,
  revenue,
}: {
  visits: MenuAnalyticsReportResponse;
  revenue?: MenuRevenueReportResponse | null;
}) {
  const [grain, setGrain] = useState<"daily" | "hourly">("daily");
  const view = useMemo(() => buildTrafficView(visits, grain, revenue), [visits, grain, revenue]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="inline-flex shrink-0 rounded-xl border border-border bg-card p-1">
          {(
            [
              { id: "daily", label: "Günlük" },
              { id: "hourly", label: "Saatlik" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setGrain(opt.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                grain === opt.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <SparkKpiStrip items={buildTrafficSparkKpis(visits, revenue)} />

      <DropoffFunnelChart
        title="Sipariş hunisi"
        description="Her aşamadaki hacim, adım dönüşümü ve kayıp"
        stages={view.stages}
        exploreHint={`Uçtan uca dönüşüm %${view.conversion.toFixed(0)}. Düşük badge’li adımda kayıp yoğunlaşıyor.`}
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <GrossVolumeCard
          title="Cihaz kırılımı"
          value={view.deviceTotal}
          trend={view.openTrend}
          rows={view.deviceRows}
        />
        <RetentionStepChart title={view.rhythmTitle} data={view.rhythm} />
        <InsightHighlightCard
          percent={`%${view.conversion.toFixed(0)}`}
          title={view.insightTitle}
          body={view.insightBody}
          progress={view.conversion}
        />
      </div>

      <TwinTrendCards
        left={{
          title: "Menü açılış",
          value: view.menuOpensLabel,
          delta: view.openTrend,
          points: view.openSeries,
        }}
        right={{
          title: "Ürün görüntüleme",
          value: view.productViewsLabel,
          delta: null,
          points: view.productSeries,
        }}
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <RankListCard title="En çok görüntülenen ürünler" items={view.topProducts} />
        <HighlightBarChart
          title="Kategori görüntüleme"
          value={view.categoryTotal}
          data={view.categoryBars}
        />
      </div>
    </div>
  );
}
