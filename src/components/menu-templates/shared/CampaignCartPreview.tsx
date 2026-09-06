"use client";

import { useEffect, useMemo, useState, createElement as h, type CSSProperties } from "react";
import { CheckCircle2, Gift } from "lucide-react";

import {
  previewCampaignCart,
  type CampaignPreviewLine,
  type CampaignPreviewResponse,
} from "@/lib/public-campaign-api";
import { cn } from "@/lib/utils";

type CampaignCartPreviewProps = {
  identifier: string;
  items: { productId: number; quantity: number }[];
};

type ProgressInfo = {
  current: number;
  required: number;
  remaining: number;
  earned: boolean;
  unit: "stamp" | "spend" | "product";
};

function toNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function resolveProgress(line: CampaignPreviewLine): ProgressInfo | null {
  const requiredStamps = toNumber(line.requiredStamps);
  if (requiredStamps != null && requiredStamps > 0) {
    const current =
      (toNumber(line.currentStamps) ?? 0) + (toNumber(line.pendingStamps) ?? 0);
    const remaining = Math.max(0, requiredStamps - current);
    const earned =
      Boolean(line.earned || line.rewardUnlocked) || current >= requiredStamps;
    return { current, required: requiredStamps, remaining, earned, unit: "stamp" };
  }

  const threshold = toNumber(line.thresholdAmount);
  if (threshold != null && threshold > 0) {
    const current =
      (toNumber(line.currentSpend) ?? 0) + (toNumber(line.pendingSpend) ?? 0);
    const remaining = Math.max(0, threshold - current);
    const earned =
      Boolean(line.earned || line.rewardUnlocked) || current >= threshold;
    return { current, required: threshold, remaining, earned, unit: "spend" };
  }

  const productCount = toNumber(line.campaignProductCount);
  if (productCount != null && productCount > 0 && requiredStamps == null) {
    const earned = Boolean(line.earned || line.rewardUnlocked);
    return {
      current: productCount,
      required: productCount,
      remaining: earned ? 0 : 1,
      earned,
      unit: "product",
    };
  }

  if (line.earned || line.rewardUnlocked) {
    return { current: 1, required: 1, remaining: 0, earned: true, unit: "stamp" };
  }

  const msg = (line.message ?? "").toLowerCase();
  if (msg.includes("kazanıld") || msg.includes("kazanildi") || msg.includes("unlocked")) {
    return { current: 1, required: 1, remaining: 0, earned: true, unit: "stamp" };
  }

  return null;
}

function progressLabel(progress: ProgressInfo, fallbackMessage?: string): string {
  if (progress.earned) return "Kazanıldı";
  if (progress.unit === "stamp") {
    if (progress.remaining <= 0) return "Kazanıldı";
    return `${progress.remaining} damga daha → ödül`;
  }
  if (progress.unit === "spend") {
    if (progress.remaining <= 0) return "Kazanıldı";
    const remaining = Number.isInteger(progress.remaining)
      ? String(progress.remaining)
      : progress.remaining.toFixed(2);
    return `${remaining} daha harcayın → ödül`;
  }
  if (fallbackMessage) return fallbackMessage;
  return `${progress.remaining} ürün daha → ödül`;
}

export function CampaignCartPreview({ identifier, items }: CampaignCartPreviewProps) {
  const [preview, setPreview] = useState<CampaignPreviewResponse | null>(null);
  const itemsKey = useMemo(
    () =>
      JSON.stringify(
        items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      ),
    [items],
  );

  useEffect(() => {
    const parsed = JSON.parse(itemsKey) as { productId: number; quantity: number }[];
    if (parsed.length === 0) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    void previewCampaignCart(identifier, { items: parsed }).then((result) => {
      if (!cancelled) setPreview(result);
    });
    return () => {
      cancelled = true;
    };
  }, [identifier, itemsKey]);

  if (!preview || preview.lines.length === 0) return null;

  return h(
    "div",
    { className: "space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-sm" },
    ...preview.lines.map((line) => {
      const progress = resolveProgress(line);
      const earned = progress?.earned ?? false;
      const ratio =
        progress && progress.required > 0
          ? Math.min(1, progress.current / progress.required)
          : earned
            ? 1
            : 0;
      const barStyle: CSSProperties = { width: `${Math.round(ratio * 100)}%` };

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
              progress
                ? progressLabel(progress, line.message)
                : line.message || "Kampanya ilerlemesi",
            ),
            progress && !earned
              ? h(
                  "div",
                  { className: "space-y-1" },
                  h(
                    "div",
                    { className: "h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/15" },
                    h("div", {
                      className: "h-full rounded-full bg-amber-500 transition-all duration-300",
                      style: barStyle,
                    }),
                  ),
                  progress.unit !== "product" || progress.required > 1
                    ? h(
                        "p",
                        { className: "text-[10px] opacity-70" },
                        progress.unit === "spend"
                          ? `${progress.current} / ${progress.required}`
                          : `${Math.min(progress.current, progress.required)} / ${progress.required}`,
                      )
                    : null,
                )
              : null,
            earned && line.message && !line.message.toLowerCase().includes("kazanıld")
              ? h("p", { className: "text-[11px] opacity-80" }, line.message)
              : null,
          ),
        ),
      );
    }),
    !preview.loggedIn
      ? h(
          "p",
          { className: "text-xs text-muted-foreground" },
          "Kampanyadan yararlanmak için giriş yapın. Misafir siparişlerde hak kaydedilmez.",
        )
      : null,
  );
}
