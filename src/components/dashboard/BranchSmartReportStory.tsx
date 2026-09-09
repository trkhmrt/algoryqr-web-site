"use client";

import { motion } from "framer-motion";

import AnalyticsChannelPanel from "@/components/dashboard/AnalyticsChannelPanel";
import AnalyticsRevenuePanel from "@/components/dashboard/AnalyticsRevenuePanel";
import AnalyticsVisitsPanel from "@/components/dashboard/AnalyticsVisitsPanel";
import AnalyticsWaiterPerformancePanel from "@/components/dashboard/AnalyticsWaiterPerformancePanel";
import { useBranchAnalyticsReport } from "@/hooks/use-branch-analytics-report";
import { useBranchRevenueReport } from "@/hooks/use-branch-revenue-report";
import { useBranchWaiterPerformanceReport } from "@/hooks/use-branch-waiter-performance-report";
import type { SmartReportResult } from "@/lib/smart-report";
import { cn } from "@/lib/utils";

function useTooltipStyle() {
  if (typeof document === "undefined") {
    return {
      backgroundColor: "hsl(0 0% 100%)",
      border: "1px solid hsl(0 0% 88%)",
      borderRadius: "8px",
      fontSize: "12px",
      color: "hsl(0 0% 10%)",
      boxShadow: "0 2px 8px hsl(0 0% 0% / 0.08)",
    };
  }
  const isDark = document.documentElement.classList.contains("dark");
  return {
    backgroundColor: isDark ? "hsl(0 0% 8%)" : "hsl(0 0% 100%)",
    border: isDark ? "1px solid hsl(0 0% 15%)" : "1px solid hsl(0 0% 88%)",
    borderRadius: "8px",
    fontSize: "12px",
    color: isDark ? "hsl(0 0% 93%)" : "hsl(0 0% 10%)",
    boxShadow: isDark ? "none" : "0 2px 8px hsl(0 0% 0% / 0.08)",
  };
}

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
  const tooltipStyle = useTooltipStyle();
  const visitQuery = useBranchAnalyticsReport(branchId, null, from, to, true);
  const revenueQuery = useBranchRevenueReport(branchId, null, from, to, true);
  const waiterQuery = useBranchWaiterPerformanceReport(branchId, null, from, to, true);

  const leader = [...(revenueQuery.data?.channels ?? [])].sort(
    (a, b) => Number(b.revenue ?? 0) - Number(a.revenue ?? 0),
  )[0];

  return (
    <div className={cn("space-y-8", compact && "space-y-5")}>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Şube özeti
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {result?.title || branchName || "Akıllı rapor"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {from} – {to}
            {leader ? ` · Lider kanal: ${leader.label}` : ""}
          </p>
        </div>
        {result?.summary ? (
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {result.summary}
          </p>
        ) : null}
      </motion.section>

      {revenueQuery.data ? (
        <section className="space-y-4" aria-label="Para ve kanallar">
          <h3 className="text-base font-semibold text-foreground">Para & kanallar</h3>
          <AnalyticsChannelPanel
            channels={revenueQuery.data.channels ?? []}
            channelDaily={revenueQuery.data.channelDaily ?? []}
            currency={revenueQuery.data.kpis?.currency || "TRY"}
            tooltipStyle={tooltipStyle}
            accountScopedNote
          />
          {!compact ? (
            <AnalyticsRevenuePanel
              report={revenueQuery.data}
              tooltipStyle={tooltipStyle}
              hideChannels
            />
          ) : null}
        </section>
      ) : revenueQuery.isLoading ? (
        <SectionSkeleton label="Ciro yükleniyor…" />
      ) : null}

      {visitQuery.data && !compact ? (
        <section className="space-y-4" aria-label="Trafik">
          <h3 className="text-base font-semibold text-foreground">Trafik & dönüşüm</h3>
          <AnalyticsVisitsPanel report={visitQuery.data} tooltipStyle={tooltipStyle} />
        </section>
      ) : null}

      {waiterQuery.data && !compact ? (
        <section className="space-y-4" aria-label="Personel">
          <h3 className="text-base font-semibold text-foreground">Personel</h3>
          <AnalyticsWaiterPerformancePanel
            report={waiterQuery.data}
            tooltipStyle={tooltipStyle}
          />
        </section>
      ) : null}

      {result?.sections && result.sections.length > 0 ? (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
          aria-label="AI içgörüler"
        >
          <h3 className="text-base font-semibold text-foreground">AI içgörüler</h3>
          <div className="grid gap-3">
            {result.sections.map((section) => (
              <div
                key={section.heading}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <p className="font-medium text-foreground">{section.heading}</p>
                <p
                  className={cn(
                    "mt-2 whitespace-pre-wrap text-sm text-muted-foreground",
                    compact && "line-clamp-5",
                  )}
                >
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        </motion.section>
      ) : null}
    </div>
  );
}

function SectionSkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
      {label}
    </div>
  );
}
