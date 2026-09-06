/** Additive cart/order campaign fields from qr-service PR #90. */
export type StampCardProgress = {
  campaignId: number;
  campaignName: string;
  currentQuantity: number;
  requiredQuantity: number;
  earned: boolean;
};

export type OrderCampaignSummary = {
  campaignProductCount?: number;
  guestOrder?: boolean;
  rewardEligible?: boolean;
  hint?: string | null;
  stampCardProgress?: StampCardProgress[];
};

export function getStampCardProgress(
  summary: OrderCampaignSummary | null | undefined,
): StampCardProgress[] {
  return summary?.stampCardProgress ?? [];
}
