import { ApiError } from "@/lib/api/errors";

export type CampaignStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED";

export type CampaignTemplate = {
  code: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  configSchema?: Record<string, unknown>;
  sortOrder: number;
};

export type CampaignItem = {
  id: number;
  menuId: number;
  templateCode: string;
  name: string;
  slogan?: string | null;
  startsAt: string;
  endsAt: string;
  status: CampaignStatus;
  config: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateCampaignPayload = {
  templateCode: string;
  name: string;
  slogan?: string;
  startsAt: string;
  endsAt: string;
  config: Record<string, unknown>;
};

export type CampaignWinner = {
  rewardId: number;
  customerId: number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  status: "AVAILABLE" | "REDEEMED" | "EXPIRED";
  issuedAt?: string;
  redeemedAt?: string | null;
  orderId?: number | null;
};

export type CampaignWinnerPage = {
  content: CampaignWinner[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
  const data = await parseJson<T & { message?: string }>(response);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      (data as { message?: string }).message ?? "Kampanya isteği başarısız",
    );
  }
  return data;
}

export async function listCampaignTemplates(): Promise<CampaignTemplate[]> {
  return request<CampaignTemplate[]>("/api/waiter-panel/campaigns/templates");
}

export async function listCampaigns(menuId: number): Promise<CampaignItem[]> {
  return request<CampaignItem[]>(`/api/waiter-panel/menu/${menuId}/campaigns`);
}

export async function getCampaign(menuId: number, campaignId: number): Promise<CampaignItem> {
  return request<CampaignItem>(
    `/api/waiter-panel/menu/${menuId}/campaigns/${campaignId}`,
  );
}

export async function listCampaignWinners(
  menuId: number,
  campaignId: number,
  params?: { q?: string; page?: number; size?: number },
): Promise<CampaignWinnerPage> {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.size != null) search.set("size", String(params.size));
  const query = search.toString();
  return request<CampaignWinnerPage>(
    `/api/waiter-panel/menu/${menuId}/campaigns/${campaignId}/winners${query ? `?${query}` : ""}`,
  );
}

export async function createCampaign(
  menuId: number,
  payload: CreateCampaignPayload,
): Promise<CampaignItem> {
  return request<CampaignItem>(`/api/waiter-panel/menu/${menuId}/campaigns`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function activateCampaign(menuId: number, campaignId: number): Promise<CampaignItem> {
  return request<CampaignItem>(
    `/api/waiter-panel/menu/${menuId}/campaigns/${campaignId}/activate`,
    { method: "POST" },
  );
}

export async function pauseCampaign(menuId: number, campaignId: number): Promise<CampaignItem> {
  return request<CampaignItem>(
    `/api/waiter-panel/menu/${menuId}/campaigns/${campaignId}/pause`,
    { method: "POST" },
  );
}
