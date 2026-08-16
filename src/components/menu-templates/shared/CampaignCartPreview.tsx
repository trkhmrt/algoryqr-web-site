"use client";

import { useEffect, useState } from "react";

import { previewCampaignCart, type CampaignPreviewResponse } from "@/lib/public-campaign-api";

type CampaignCartPreviewProps = {
  identifier: string;
  items: { productId: number; quantity: number }[];
};

export function CampaignCartPreview({ identifier, items }: CampaignCartPreviewProps) {
  const [preview, setPreview] = useState<CampaignPreviewResponse | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    void previewCampaignCart(identifier, { items }).then((result) => {
      if (!cancelled) setPreview(result);
    });
    return () => {
      cancelled = true;
    };
  }, [identifier, items]);

  if (!preview || preview.lines.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-sm">
      {preview.lines.map((line) => (
        <p key={line.campaignId} className="text-amber-900 dark:text-amber-100">
          {line.message}
        </p>
      ))}
      {!preview.loggedIn ? (
        <p className="text-xs text-muted-foreground">
          Kampanyadan yararlanmak için giriş yapın. Misafir siparişlerde hak kaydedilmez.
        </p>
      ) : null}
    </div>
  );
}
