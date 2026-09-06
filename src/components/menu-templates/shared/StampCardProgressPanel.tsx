"use client";

import { createElement as h } from "react";
import { CheckCircle2, Gift } from "lucide-react";

import type { StampCardProgress } from "@/lib/ordering-campaign-types";
import { cn } from "@/lib/utils";

type StampCardProgressPanelProps = {
  progress: StampCardProgress[];
  guestHint?: boolean;
};

export function StampCardProgressPanel({ progress, guestHint }: StampCardProgressPanelProps) {
  if (!progress.length) return null;

  return h(
    "div",
    { className: "space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-sm" },
    ...progress.map((line) => {
      const earned = Boolean(line.earned);
      const required = Math.max(1, line.requiredQuantity || 1);
      const current = Math.max(0, line.currentQuantity || 0);
      const remaining = Math.max(0, required - current);
      const ratio = Math.min(1, current / required);

      return h(
        "div",
        {
          key: line.campaignId,
          className: cn(
            "rounded-md px-2 py-2",
            earned
              ? "bg-emerald-500/15 text-emerald-900 dark:text-emerald-100"
              : "text-amber-900 dark:text-amber-100",
          ),
        },
        h(
          "div",
          { className: "flex items-start gap-2" },
          earned
            ? h(CheckCircle2, {
                className: "mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400",
              })
            : h(Gift, { className: "mt-0.5 h-4 w-4 shrink-0 opacity-80" }),
          h(
            "div",
            { className: "min-w-0 flex-1 space-y-1.5" },
            h(
              "div",
              { className: "flex flex-wrap items-center gap-2" },
              h(
                "p",
                { className: "text-sm font-medium leading-tight" },
                line.campaignName || "Kampanya",
              ),
              earned
                ? h(
                    "span",
                    {
                      className:
                        "rounded-full bg-emerald-600/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300",
                    },
                    "Kazanıldı",
                  )
                : null,
            ),
            h(
              "p",
              { className: "text-xs opacity-90" },
              earned
                ? "Kazanıldı"
                : `${remaining} ürün daha → ödül`,
            ),
            !earned
              ? h(
                  "div",
                  { className: "space-y-1" },
                  h(
                    "div",
                    { className: "h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/15" },
                    h("div", {
                      className: "h-full rounded-full bg-amber-500 transition-all duration-300",
                      style: { width: `${Math.round(ratio * 100)}%` },
                    }),
                  ),
                  h(
                    "p",
                    { className: "text-[10px] opacity-70" },
                    `${Math.min(current, required)} / ${required}`,
                  ),
                )
              : null,
          ),
        ),
      );
    }),
    guestHint
      ? h(
          "p",
          { className: "text-xs text-muted-foreground" },
          "Kampanyadan yararlanmak için giriş yapın. Misafir siparişlerde hak kaydedilmez.",
        )
      : null,
  );
}
