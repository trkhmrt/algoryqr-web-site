"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, Loader2, RefreshCw } from "lucide-react";

import {
  fetchCustomerRewards,
  type CustomerCampaignReward,
} from "@/lib/public-campaign-api";

type CustomerRewardsPanelProps = {
  publicId: string;
  onBack?: () => void;
  /** Compact embed (e.g. above order history). */
  compact?: boolean;
};

function statusLabel(status?: string): string {
  switch ((status ?? "").toUpperCase()) {
    case "AVAILABLE":
    case "PENDING":
      return "Kullanılabilir";
    case "REDEEMED":
      return "Kullanıldı";
    case "EXPIRED":
      return "Süresi doldu";
    default:
      return status || "Ödül";
  }
}

function formatWhen(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CustomerRewardsPanel({
  publicId,
  onBack,
  compact = false,
}: CustomerRewardsPanelProps) {
  const [rewards, setRewards] = useState<CustomerCampaignReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchCustomerRewards(publicId);
      setRewards(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ödüller yüklenemedi");
      setRewards([]);
    } finally {
      setLoading(false);
    }
  }, [publicId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Kampanya ödülleri yükleniyor…
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-1.5 text-sm font-medium">
          <Gift className="h-4 w-4" />
          {compact ? "Kazanılan ödüller" : "Kampanyalar"}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Yenile"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="text-xs text-muted-foreground underline"
            >
              Geri
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs font-medium text-destructive underline"
          >
            Tekrar dene
          </button>
        </div>
      ) : null}

      {!error && rewards.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          Henüz kazanılmış kampanya ödülünüz yok.
        </p>
      ) : null}

      {rewards.length > 0 ? (
        <ul className="space-y-2">
          {rewards.map((reward) => (
            <li
              key={reward.id}
              className="rounded-lg border border-border px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {reward.campaignName || `Ödül #${reward.id}`}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatWhen(reward.issuedAt)}
                    {reward.orderId != null ? ` · Sipariş #${reward.orderId}` : ""}
                  </p>
                  {reward.message ? (
                    <p className="mt-1 text-xs text-muted-foreground">{reward.message}</p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {statusLabel(reward.status)}
                </span>
              </div>
              {reward.claimUrl || reward.claimToken ? (
                <a
                  href={
                    reward.claimUrl ||
                    `/reward/claim?c=${encodeURIComponent(reward.claimToken!)}`
                  }
                  className="mt-2 inline-block text-xs font-medium text-foreground underline"
                >
                  Ödül bağlantısı
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
