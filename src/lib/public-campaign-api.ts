export type ActiveCampaign = {
  id: number;
  templateCode: string;
  name: string;
  slogan?: string | null;
  config?: Record<string, unknown>;
  targetProductIds?: number[];
};

export type CampaignPreviewLine = {
  campaignId: number;
  campaignName: string;
  templateCode: string;
  campaignProductCount?: number;
  pendingStamps?: number;
  currentStamps?: number;
  requiredStamps?: number;
  pendingSpend?: number | string;
  currentSpend?: number | string;
  thresholdAmount?: number | string;
  message?: string;
};

export type CampaignPreviewResponse = {
  lines: CampaignPreviewLine[];
  totalCampaignProducts: number;
  loggedIn: boolean;
};

export type ProduceRewardResponse = {
  autoAssigned: boolean;
  rewardId?: number;
  claimToken?: string;
  claimUrl?: string;
  message?: string;
};

export type ClaimInfoResponse = {
  status: string;
  campaignName?: string;
  message?: string;
  requiresLogin?: boolean;
  alreadyClaimed?: boolean;
};

export async function fetchActiveCampaigns(identifier: string): Promise<ActiveCampaign[]> {
  const response = await fetch(`/api/menu/public/${encodeURIComponent(identifier)}/campaigns/active`, {
    credentials: "include",
  });
  if (!response.ok) return [];
  return response.json();
}

export async function fetchCampaignProductIds(identifier: string): Promise<number[]> {
  const response = await fetch(
    `/api/menu/public/${encodeURIComponent(identifier)}/campaigns/product-ids`,
    { credentials: "include" },
  );
  if (!response.ok) return [];
  return response.json();
}

export async function previewCampaignCart(
  identifier: string,
  payload: { items: { productId: number; quantity: number }[] },
): Promise<CampaignPreviewResponse> {
  const response = await fetch(
    `/api/menu/public/${encodeURIComponent(identifier)}/campaigns/preview`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    return { lines: [], totalCampaignProducts: 0, loggedIn: false };
  }
  return response.json();
}

export async function produceCampaignReward(
  identifier: string,
  orderId: number,
): Promise<ProduceRewardResponse> {
  const response = await fetch(
    `/api/menu/public/${encodeURIComponent(identifier)}/campaigns/rewards/${orderId}/produce`,
    { method: "POST", credentials: "include" },
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message ?? "Ödül üretilemedi");
  }
  return data;
}

export async function fetchClaimInfo(token: string): Promise<ClaimInfoResponse> {
  const response = await fetch(`/api/campaign/claim?c=${encodeURIComponent(token)}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Claim bilgisi alınamadı");
  }
  return response.json();
}

export async function claimCampaignReward(token: string): Promise<{ rewardId?: number; message?: string }> {
  const response = await fetch(`/api/campaign/claim?c=${encodeURIComponent(token)}`, {
    method: "POST",
    credentials: "include",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message ?? "Claim başarısız");
  }
  return data;
}
