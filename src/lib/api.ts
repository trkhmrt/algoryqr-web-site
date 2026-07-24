"use client";

import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { isDateUsablePurchase, pickActivePurchase } from "@/lib/product-access";

export { ApiError } from "@/lib/api/errors";
export {
  hasActiveProductAccess,
  hasExpiredProductAccess,
  isDateUsableEntitlement,
  isDateUsablePurchase,
  pickActivePurchase,
} from "@/lib/product-access";

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
      slogan?: string;
      phone?: string;
      email?: string;
      address?: string;
      themeId: string;
      urlMode: string;
      publicSlug?: string;
      products?: Array<{
        name: string;
        description?: string;
        price?: number;
        currency?: string;
        category?: string;
        imageUrl?: string;
        available?: boolean;
        sortOrder?: number;
      }>;
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
  unlimited: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  purchaseStatus?: string | null;
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
  purchaseType?: string;
  paymentMode?: string;
  paymentStyle?: string;
  installmentCount?: number;
  paymentId?: string | null;
  paymentConversationId?: string | null;
  paymentMethodId?: number | null;
  cardBrand?: string | null;
  cardLastFour?: string | null;
  startsAt?: string;
  expiresAt?: string;
  purchasedAt?: string;
  subscriptionStatus?: string | null;
  billingPeriod?: "MONTHLY" | "YEARLY" | string | null;
  cancelAtPeriodEnd?: boolean;
  currentPeriodConversationId?: string | null;
  currentPeriodPaidAt?: string | null;
  refundEligibleUntil?: string | null;
  refundEligible?: boolean;
  refundedAt?: string | null;
  refundStatus?: string | null;
  daysUntilExpiry?: number | null;
  nextPaymentDueAt?: string | null;
  paymentApproaching?: boolean;
  expiryApproaching?: boolean;
  usable: boolean;
  expired: boolean;
}

export type PurchaseStatus =
  | "PENDING"
  | "ACTIVE"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "SUPERSEDED";

export interface InstallmentOptionApiItem {
  installmentCount: number;
  monthlyAmount?: number | string;
  totalAmount?: number | string;
}

export interface InstallmentScheduleApiItem {
  installmentNumber: number;
  dueAt?: string;
  amount: number | string;
  currency?: string;
  status: string;
  startsAt?: string;
  expiresAt?: string;
}

export interface PurchaseBillingSnapshotApi {
  billingAddressId?: number | null;
  type?: string | null;
  name?: string | null;
  surname?: string | null;
  legalName?: string | null;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface PurchaseSummaryApiItem {
  purchaseId: number;
  packageId: number;
  packageCode: string;
  packageName: string;
  price: number | string;
  currency: string;
  status: PurchaseStatus;
  purchaseType?: string;
  paymentStyle?: string;
  startsAt?: string;
  expiresAt?: string;
  purchasedAt?: string;
  subscriptionStatus?: string | null;
  billingPeriod?: "MONTHLY" | "YEARLY" | string | null;
  cancelAtPeriodEnd?: boolean;
  currentPeriodConversationId?: string | null;
  currentPeriodPaidAt?: string | null;
  refundEligibleUntil?: string | null;
  refundEligible?: boolean;
  refundedAt?: string | null;
  refundStatus?: string | null;
  daysUntilExpiry?: number | null;
  nextPaymentDueAt?: string | null;
  paymentApproaching?: boolean;
  expiryApproaching?: boolean;
  expired: boolean;
  usable: boolean;
  paymentMode?: "DIRECT" | "THREE_DS" | string;
  installmentCount?: number;
  paymentId?: string | null;
  paymentConversationId?: string | null;
  paymentMethodId?: number | null;
  cardBrand?: string | null;
  cardLastFour?: string | null;
  billingSnapshot?: PurchaseBillingSnapshotApi | null;
  products?: UserEntitlementApiItem[];
  monthlyAmount?: number | string;
  totalAmount?: number | string;
  installmentSchedule?: InstallmentScheduleApiItem[];
  installments?: InstallmentScheduleApiItem[];
  retryPaymentAvailable?: boolean;
  updateCardAvailable?: boolean;
}

export interface PlanPackageItemApi {
  id: number;
  productId?: number;
  productCode: string;
  productName: string;
  quantity: number;
  unlimited: boolean;
}

export interface PlanPackageApiItem {
  id: number;
  code: string;
  name: string;
  description: string;
  features?: string[];
  price: number | string;
  monthlyDiscount?: number | string | null;
  yearlyPrice?: number | string | null;
  yearlyDiscount?: number | string | null;
  effectiveMonthlyPrice?: number | string | null;
  effectiveYearlyPrice?: number | string | null;
  currency: string;
  active: boolean;
  validityDays: number;
  trialEligible?: boolean;
  items: PlanPackageItemApi[];
  allowedPaymentModes?: Array<"DIRECT" | "THREE_DS">;
  installmentOptions?: InstallmentOptionApiItem[];
  allowedInstallments?: number[];
}

export interface PackageUsageSummary {
  packageName: string;
  packageCode?: string | null;
  packageId?: number | null;
  purchaseType?: string | null;
  remaining: number;
  total: number;
  used: number;
  unlimited: boolean;
  expiresAt?: string | null;
  daysUntilExpiry?: number | null;
  nextPaymentDueAt?: string | null;
  paymentApproaching?: boolean;
  expiryApproaching?: boolean;
  usable?: boolean;
  isTrial?: boolean;
}

export function aggregatePackageUsage(
  entitlements: UserEntitlementApiItem[],
  purchases: PurchaseApiItem[],
): PackageUsageSummary {
  const activeEntitlements = entitlements.filter(
    (item) => (item.productCode === "QR_CREATE" || item.productCode === "QR_MENU") && item.usable && !item.expired,
  );
  const qrEntitlements = activeEntitlements.filter((item) => item.productCode === "QR_CREATE");
  const unlimited = qrEntitlements.some((item) => item.unlimited);
  const remaining = qrEntitlements.reduce((sum, item) => sum + item.remainingQuantity, 0);
  const total = qrEntitlements.reduce((sum, item) => sum + item.totalQuantity, 0);
  const used = qrEntitlements.reduce((sum, item) => sum + item.usedQuantity, 0);
  const activePurchase = pickActivePurchase(purchases);

  return {
    packageName: activePurchase?.packageName ?? "Ücretsiz Paket",
    packageCode: activePurchase?.packageCode ?? null,
    packageId: activePurchase?.packageId ?? null,
    purchaseType: activePurchase?.purchaseType ?? null,
    remaining,
    total,
    used,
    unlimited,
    expiresAt: activePurchase?.expiresAt ?? null,
    daysUntilExpiry: activePurchase?.daysUntilExpiry ?? null,
    nextPaymentDueAt: activePurchase?.nextPaymentDueAt ?? null,
    paymentApproaching: activePurchase?.paymentApproaching ?? false,
    expiryApproaching: activePurchase?.expiryApproaching ?? false,
    usable: activePurchase ? isDateUsablePurchase(activePurchase) : false,
    isTrial: activePurchase?.purchaseType === "TRIAL",
  };
}

export async function getMyEntitlementsRequest(): Promise<UserEntitlementApiItem[]> {
  const response = await api.get<UserEntitlementApiItem[] | { content?: UserEntitlementApiItem[] }>(
    "/purchases/my/entitlements",
  );
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

export async function getMyPurchasesRequest(): Promise<PurchaseApiItem[]> {
  const response = await api.get<PurchaseApiItem[] | { content?: PurchaseApiItem[] }>("/purchases/my");
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

export async function getActivePackagesRequest(): Promise<PlanPackageApiItem[]> {
  const response = await api.get<PlanPackageApiItem[]>("/packages");
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
  slogan?: string;
  phone?: string;
  email?: string;
  address?: string;
  publicSlug?: string;
  urlMode: string;
  publicUrl: string;
  active: boolean;
}

export type NutritionBasis = "PER_100G" | "PER_100ML";

export interface NutritionNutrientEntry {
  name: string;
  value?: number | string | null;
  unit?: string | null;
}

export interface NutritionFacts {
  basis?: NutritionBasis | null;
  energyKj?: number | string | null;
  energyKcal?: number | string | null;
  fat?: number | string | null;
  saturatedFat?: number | string | null;
  carbohydrate?: number | string | null;
  sugars?: number | string | null;
  polyols?: number | string | null;
  starch?: number | string | null;
  fibre?: number | string | null;
  protein?: number | string | null;
  salt?: number | string | null;
  vitaminsAndMinerals?: NutritionNutrientEntry[] | null;
  otherNutrients?: NutritionNutrientEntry[] | null;
}

export interface MenuProductApiItem {
  productId: number;
  menuId: number;
  name: string;
  description?: string;
  price?: number | string;
  currency: string;
  category?: string;
  categoryId?: number | null;
  categoryName?: string;
  categoryPath?: string;
  sortOrder: number;
  imageUrl?: string;
  available: boolean;
  nutrition?: NutritionFacts | null;
}

export interface MenuCategoryApiItem {
  categoryId: number;
  menuId: number;
  parentId?: number | null;
  name: string;
  sortOrder: number;
  children: MenuCategoryApiItem[];
}

export interface MenuCategoryRequestBody {
  name: string;
  parentId?: number | null;
  sortOrder?: number;
}

export interface MenuCategoryUpdateBody {
  name?: string;
  parentId?: number | null;
  sortOrder?: number;
}

export interface PublicMenuApiResponse {
  menu: MenuProfileApiItem;
  products: MenuProductApiItem[];
  categories?: MenuCategoryApiItem[];
  themeId: string;
}

export interface MenuProductRequestBody {
  name: string;
  description?: string;
  price?: number | string;
  currency?: string;
  category?: string;
  categoryId?: number | null;
  sortOrder?: number;
  imageUrl?: string;
  available?: boolean;
  nutrition?: NutritionFacts;
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

export async function patchMenuProductNutritionRequest(
  productId: number | string,
  payload: NutritionFacts,
): Promise<MenuProductApiItem> {
  const response = await api.patch<MenuProductApiItem>(`/menu/products/${productId}/nutrition`, payload);
  return response.data;
}

export async function deleteMenuProductRequest(productId: number | string): Promise<void> {
  await api.delete(`/menu/products/${productId}`);
}

export async function getMenuCategoriesRequest(menuId: number | string): Promise<MenuCategoryApiItem[]> {
  const response = await api.get<MenuCategoryApiItem[]>(`/menu/${menuId}/categories`);
  return response.data;
}

export async function createMenuCategoryRequest(
  menuId: number | string,
  payload: MenuCategoryRequestBody,
): Promise<MenuCategoryApiItem> {
  const response = await api.post<MenuCategoryApiItem>(`/menu/${menuId}/categories`, payload);
  return response.data;
}

export async function updateMenuCategoryRequest(
  categoryId: number | string,
  payload: MenuCategoryUpdateBody,
): Promise<MenuCategoryApiItem> {
  const response = await api.put<MenuCategoryApiItem>(`/menu/categories/${categoryId}`, payload);
  return response.data;
}

export async function deleteMenuCategoryRequest(categoryId: number | string): Promise<void> {
  await api.delete(`/menu/categories/${categoryId}`);
}

export function flattenMenuCategories(
  categories: MenuCategoryApiItem[],
  depth = 0,
): Array<{ id: number; label: string }> {
  return categories.flatMap((category) => [
    {
      id: category.categoryId,
      label: `${depth > 0 ? `${"— ".repeat(depth)}` : ""}${category.name}`,
    },
    ...flattenMenuCategories(category.children ?? [], depth + 1),
  ]);
}

export interface MenuUpdateRequestBody {
  themeId?: string;
  businessName?: string;
  slogan?: string;
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

export interface MenuAnalyticsReportKpis {
  sessions: number;
  menuOpens: number;
  productViews: number;
  categoryViews: number;
  avgProductsPerSession: number;
}

export interface MenuAnalyticsReportResponse {
  menuId: number;
  menuName: string;
  from: string;
  to: string;
  kpis: MenuAnalyticsReportKpis;
  daily: { date: string; sessions: number; menuOpens: number; productViews: number }[];
  hourly: { hour: number; views: number }[];
  devices: { name: string; value: number }[];
  topProducts: { productId: number; name: string; views: number }[];
  topCategories: { categoryId: number; name: string; views: number }[];
  categoryProductTree: { name: string; size: number; children?: { name: string; size: number }[] }[];
  sampleJourneys: {
    sessionId: string;
    startedAt: string;
    steps: { type: string; name: string; at: string }[];
  }[];
  funnel: { menuOpens: number; categoryViews: number; productViews: number };
}

export async function getMenuAnalyticsReportRequest(
  menuId: number | string,
  from: string,
  to: string,
): Promise<MenuAnalyticsReportResponse> {
  const response = await api.get<MenuAnalyticsReportResponse>(
    `/analytics/menu/${menuId}/report`,
    { params: { from, to } },
  );
  return response.data;
}
