"use client";

import { api } from "@/lib/api/client";

export { ApiError } from "@/lib/api/errors";

const USER_KEY = "algory_user";
const hasWindow = typeof window !== "undefined";

export interface StoredUser {
  id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export function setStoredUser(user: StoredUser) {
  if (!hasWindow) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): StoredUser | null {
  if (!hasWindow) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function clearStoredUser() {
  if (!hasWindow) return;
  localStorage.removeItem(USER_KEY);
}

export type QrRequestDetails =
  | {
      url: string;
    }
  | {
      ssid: string;
      password: string;
      security: "WPA" | "WEP" | "NONE";
    }
  | {
      mail: string;
      subject: string;
      body: string;
    }
  | {
      fullName: string;
      phone: string;
      mail: string;
      company: string;
      title: string;
    }
  | {
      text: string;
    }
  | {
      latitude: string;
      longitude: string;
      label: string;
    };

export interface CreateQrRequestBody {
  userId?: number | string;
  qrName: string;
  type: string;
  details: QrRequestDetails;
}

export interface QrResponse {
  id: string;
  qrName: string;
  type: string;
  details: QrRequestDetails;
  imgSrc: string;
  status: "active" | "inactive" | "draft";
  createdAt: string;
  updatedAt: string;
  scans: number;
}

export interface CreateQrResponse {
  qrResponse: QrResponse;
}

export interface UpdateQrRequestBody {
  userId?: number | string;
  qrName: string;
  type: string;
  details: QrRequestDetails;
}

type UpdateQrGatewayResponse = {
  imgSrc: string;
};

export interface UpdateQrNameRequestBody {
  qrName: string;
}

type UpdateQrNameGatewayResponse = {
  qrName?: string;
  id?: number | string;
};

export interface UserQrApiItem {
  qrId: number;
  userId?: number;
  customerId?: number;
  qrName: string;
  imgSrc: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface UserEntitlementApiItem {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  purchaseId: number;
  totalQuantity: number;
  remainingQuantity: number;
  usedQuantity: number;
  usable: boolean;
  expired: boolean;
}

export interface PurchaseApiItem {
  id: number;
  packageId?: number;
  packageName: string;
  packageCode: string;
  price?: number | string;
  currency?: string;
  status?: string;
  startsAt?: string;
  expiresAt?: string;
  purchasedAt?: string;
  usable: boolean;
  expired: boolean;
}

export interface PlanPackageItemApi {
  id: number;
  productId?: number;
  productCode: string;
  productName: string;
  quantity: number;
}

export interface PlanPackageApiItem {
  id: number;
  code: string;
  name: string;
  description: string;
  price: number | string;
  currency: string;
  active: boolean;
  validityDays: number;
  items: PlanPackageItemApi[];
}

export interface PackageUsageSummary {
  packageName: string;
  remaining: number;
  total: number;
  used: number;
}

export function aggregatePackageUsage(
  entitlements: UserEntitlementApiItem[],
  purchases: PurchaseApiItem[],
): PackageUsageSummary {
  const activeEntitlements = entitlements.filter(
    (item) => item.productCode === "QR_CREATE" && item.usable && !item.expired,
  );
  const remaining = activeEntitlements.reduce((sum, item) => sum + item.remainingQuantity, 0);
  const total = activeEntitlements.reduce((sum, item) => sum + item.totalQuantity, 0);
  const used = activeEntitlements.reduce((sum, item) => sum + item.usedQuantity, 0);
  const activePurchase = purchases.find((item) => item.usable && !item.expired) ?? purchases[0];

  return {
    packageName: activePurchase?.packageName ?? "Ücretsiz Paket",
    remaining,
    total,
    used,
  };
}

export async function getMyEntitlementsRequest(): Promise<UserEntitlementApiItem[]> {
  const response = await api.get<UserEntitlementApiItem[]>("/purchases/my/entitlements");
  return response.data;
}

export async function getMyPurchasesRequest(): Promise<PurchaseApiItem[]> {
  const response = await api.get<PurchaseApiItem[]>("/purchases/my");
  return response.data;
}

export async function getActivePackagesRequest(): Promise<PlanPackageApiItem[]> {
  const response = await api.get<PlanPackageApiItem[]>("/packages");
  return response.data;
}

export async function purchasePackageRequest(packageId: number): Promise<PurchaseApiItem> {
  const response = await api.post<PurchaseApiItem>("/purchases", { packageId });
  return response.data;
}

type CreateQrGatewayResponse = {
  imgSrc: string;
};

export async function createQrRequest(payload: CreateQrRequestBody): Promise<CreateQrResponse> {
  const requestBody = {
    qrName: payload.qrName,
    type: payload.type,
    details: payload.details,
  };
  const response = await api.post<CreateQrGatewayResponse>("/qr/create", requestBody);
  const now = new Date().toISOString();

  return {
    qrResponse: {
      id: `temp-${Date.now()}`,
      qrName: payload.qrName,
      type: payload.type,
      details: payload.details,
      imgSrc: response.data.imgSrc,
      status: "active",
      createdAt: now,
      updatedAt: now,
      scans: 0,
    },
  };
}

export async function getUserQrsRequest(userId: number | string): Promise<UserQrApiItem[]> {
  const response = await api.get<UserQrApiItem[]>(`/qr/user/${userId}`);
  return response.data;
}

export async function deleteQrRequest(qrId: number | string): Promise<string> {
  const response = await api.delete<string>(`/qr/delete/${qrId}`);
  return response.data;
}

export async function updateQrRequest(
  qrId: number | string,
  payload: UpdateQrRequestBody
): Promise<UpdateQrGatewayResponse> {
  const requestBody = {
    userId: payload.userId,
    qrName: payload.qrName,
    type: payload.type,
    details: payload.details,
  };
  const response = await api.put<UpdateQrGatewayResponse>(`/qr/update/${qrId}`, requestBody);
  return response.data;
}

export async function updateQrNameRequest(
  qrId: number | string,
  payload: UpdateQrNameRequestBody
): Promise<UpdateQrNameGatewayResponse> {
  const response = await api.patch<UpdateQrNameGatewayResponse>(`/qr/update-name/${qrId}`, payload);
  return response.data;
}
