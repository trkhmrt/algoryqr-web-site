"use client";

import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

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
    }
  | {
      businessName: string;
      phone?: string;
      email?: string;
      address?: string;
      themeId: string;
      urlMode: string;
      publicSlug?: string;
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
  qrId?: number;
  publicUrl?: string;
  menuId?: number;
  urlMode?: string;
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
    (item) => (item.productCode === "QR_CREATE" || item.productCode === "QR_MENU") && item.usable && !item.expired,
  );
  const qrEntitlements = activeEntitlements.filter((item) => item.productCode === "QR_CREATE");
  const remaining = qrEntitlements.reduce((sum, item) => sum + item.remainingQuantity, 0);
  const total = qrEntitlements.reduce((sum, item) => sum + item.totalQuantity, 0);
  const used = qrEntitlements.reduce((sum, item) => sum + item.usedQuantity, 0);
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
  qrId?: number;
  publicUrl?: string;
  menuId?: number;
  urlMode?: string;
};

export interface MenuProfileApiItem {
  menuId: number;
  qrId: number;
  userId: number;
  themeId: string;
  businessName: string;
  phone?: string;
  email?: string;
  address?: string;
  publicSlug?: string;
  urlMode: string;
  publicUrl: string;
  active: boolean;
}

export interface MenuProductApiItem {
  productId: number;
  menuId: number;
  name: string;
  description?: string;
  price?: number | string;
  currency: string;
  category?: string;
  sortOrder: number;
  imageUrl?: string;
  available: boolean;
}

export interface PublicMenuApiResponse {
  menu: MenuProfileApiItem;
  products: MenuProductApiItem[];
  themeId: string;
}

export interface MenuProductRequestBody {
  name: string;
  description?: string;
  price?: number | string;
  currency?: string;
  category?: string;
  sortOrder?: number;
  imageUrl?: string;
  available?: boolean;
}

export async function checkMenuSlugAvailabilityRequest(slug: string, excludeMenuId?: number) {
  const params = new URLSearchParams({ slug });
  if (excludeMenuId != null) params.set("excludeMenuId", String(excludeMenuId));
  const response = await api.get<{ slug: string; available: boolean }>(`/menu/slug-available?${params.toString()}`);
  return response.data;
}

export async function getMenuByQrIdRequest(qrId: number | string): Promise<MenuProfileApiItem> {
  const response = await api.get<MenuProfileApiItem>(`/menu/by-qr/${qrId}`);
  return response.data;
}

export async function getMenuProductsRequest(menuId: number | string): Promise<MenuProductApiItem[]> {
  const response = await api.get<MenuProductApiItem[]>(`/menu/${menuId}/products`);
  return response.data;
}

export async function createMenuProductRequest(
  menuId: number | string,
  payload: MenuProductRequestBody,
): Promise<MenuProductApiItem> {
  const response = await api.post<MenuProductApiItem>(`/menu/${menuId}/products`, payload);
  return response.data;
}

export async function updateMenuProductRequest(
  productId: number | string,
  payload: MenuProductRequestBody,
): Promise<MenuProductApiItem> {
  const response = await api.put<MenuProductApiItem>(`/menu/products/${productId}`, payload);
  return response.data;
}

export async function deleteMenuProductRequest(productId: number | string): Promise<void> {
  await api.delete(`/menu/products/${productId}`);
}

export interface MenuUpdateRequestBody {
  themeId?: string;
  businessName?: string;
  phone?: string;
  email?: string;
  address?: string;
  urlMode?: string;
  publicSlug?: string;
  active?: boolean;
}

export async function updateMenuRequest(menuId: number | string, payload: MenuUpdateRequestBody): Promise<MenuProfileApiItem> {
  const response = await api.patch<MenuProfileApiItem>(`/menu/${menuId}`, payload);
  return response.data;
}

export async function getPublicMenuRequest(identifier: string): Promise<PublicMenuApiResponse> {
  const response = await fetch(`/api/menu/public/${encodeURIComponent(identifier)}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new ApiError(response.status, "Menü bulunamadı");
  }
  return response.json() as Promise<PublicMenuApiResponse>;
}

export async function createQrRequest(payload: CreateQrRequestBody): Promise<CreateQrResponse> {
  const requestBody = {
    qrName: payload.qrName,
    type: payload.type,
    details: payload.details,
  };
  const response = await api.post<CreateQrGatewayResponse>("/qr/create", requestBody);
  const now = new Date().toISOString();
  const qrId = response.data.qrId;

  return {
    qrResponse: {
      id: qrId != null ? String(qrId) : `temp-${Date.now()}`,
      qrName: payload.qrName,
      type: payload.type,
      details: payload.details,
      imgSrc: response.data.imgSrc,
      status: "active",
      createdAt: now,
      updatedAt: now,
      scans: 0,
    },
    qrId,
    publicUrl: response.data.publicUrl,
    menuId: response.data.menuId,
    urlMode: response.data.urlMode,
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
