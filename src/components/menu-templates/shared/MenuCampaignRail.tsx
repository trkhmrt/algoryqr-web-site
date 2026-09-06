"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Megaphone } from "lucide-react";

import type { ActiveCampaign } from "@/lib/public-campaign-api";
import { cn } from "@/lib/utils";

import { useActiveCampaigns } from "./campaign-product-context";

type MenuCampaignRailProps = {
  className?: string;
  cardClassName?: string;
};

function CampaignCard({
  campaign,
  className,
}: {
  campaign: ActiveCampaign;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "relative w-full shrink-0 snap-center overflow-hidden rounded-2xl border border-black/10 bg-black/5",
        className,
      )}
    >
      {campaign.imageUrl ? (
        <div className="relative aspect-[21/9] w-full overflow-hidden">
          <img
            src={campaign.imageUrl}
            alt={campaign.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <p className="text-sm font-semibold leading-tight">{campaign.name}</p>
            {campaign.slogan ? (
              <p className="mt-1 line-clamp-2 text-xs text-white/85">{campaign.slogan}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex min-h-[5.5rem] items-start gap-3 px-4 py-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/10">
            <Megaphone className="h-4 w-4 opacity-70" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-60">
              Kampanya
            </p>
            <p className="mt-0.5 text-sm font-semibold leading-tight">{campaign.name}</p>
            {campaign.slogan ? (
              <p className="mt-1 line-clamp-2 text-xs opacity-70">{campaign.slogan}</p>
            ) : null}
          </div>
        </div>
      )}
    </article>
  );
}

export function MenuCampaignRail({ className, cardClassName }: MenuCampaignRailProps) {
  const campaigns = useActiveCampaigns();
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (campaigns.length === 0) return null;

  if (campaigns.length === 1) {
    return (
      <div className={cn("w-full", className)}>
        <CampaignCard campaign={campaigns[0]} className={cardClassName} />
      </div>
    );
  }

  function scrollByCard(direction: -1 | 1) {
    const node = scrollerRef.current;
    if (!node) return;
    const amount = Math.max(node.clientWidth * 0.85, 240);
    node.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  return (
    <div className={cn("relative w-full", className)}>
      <button
        type="button"
        aria-label="Önceki kampanya"
        onClick={() => scrollByCard(-1)}
        className="absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 text-black shadow-sm backdrop-blur-sm transition hover:bg-white"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Sonraki kampanya"
        onClick={() => scrollByCard(1)}
        className="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 text-black shadow-sm backdrop-blur-sm transition hover:bg-white"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-10 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="w-[min(100%,22rem)] shrink-0 snap-center sm:w-[min(100%,26rem)]">
            <CampaignCard campaign={campaign} className={cardClassName} />
          </div>
        ))}
      </div>
    </div>
  );
}
