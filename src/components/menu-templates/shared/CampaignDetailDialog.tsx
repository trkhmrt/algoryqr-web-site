"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ActiveCampaign } from "@/lib/public-campaign-api";

import {
  campaignConditionLines,
  formatCampaignDate,
} from "./campaign-detail-helpers";

type CampaignDetailDialogProps = {
  campaign: ActiveCampaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CampaignDetailDialog({
  campaign,
  open,
  onOpenChange,
}: CampaignDetailDialogProps) {
  if (!campaign) return null;

  const startsAt = formatCampaignDate(campaign.startsAt);
  const endsAt = formatCampaignDate(campaign.endsAt);
  const conditions = campaignConditionLines(campaign);
  const terms = campaign.terms?.trim() || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] max-w-md overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle>{campaign.name}</DialogTitle>
          {campaign.slogan ? (
            <DialogDescription>{campaign.slogan}</DialogDescription>
          ) : (
            <DialogDescription>Kampanya detayları ve geçerlilik koşulları</DialogDescription>
          )}
        </DialogHeader>

        {campaign.imageUrl ? (
          <div className="overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={campaign.imageUrl}
              alt={campaign.name}
              className="aspect-[21/9] w-full object-cover"
            />
          </div>
        ) : null}

        <div className="space-y-4 text-sm">
          {(startsAt || endsAt) ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {startsAt ? (
                <div>
                  <p className="text-xs text-muted-foreground">Başlangıç</p>
                  <p className="mt-0.5 font-medium">{startsAt}</p>
                </div>
              ) : null}
              {endsAt ? (
                <div>
                  <p className="text-xs text-muted-foreground">Bitiş</p>
                  <p className="mt-0.5 font-medium">{endsAt}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Geçerlilik
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-muted-foreground">
              {conditions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          {terms ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Şartlar
              </p>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{terms}</p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
