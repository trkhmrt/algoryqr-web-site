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
      chefName?: string;
      chefAvatarKey?: string;
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
  imgSrc?: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface UserQrPageApiResponse {
  content: UserQrApiItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
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
  lastUsage?: string | null;
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
  subscriptionGraceEndsAt?: string | null;
  manualPaymentRequired?: boolean;
  refundEligibleUntil?: string | null;
  refundEligible?: boolean;
  refundableAmount?: number | string | null;
  refundCoolingDays?: number | null;
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
  subscriptionGraceEndsAt?: string | null;
  manualPaymentRequired?: boolean;
  refundEligibleUntil?: string | null;
  refundEligible?: boolean;
  refundableAmount?: number | string | null;
  refundCoolingDays?: number | null;
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
  priority?: number | null;
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
};

export interface MenuQrBriefApiItem {
  id: number;
  name?: string;
  imgSrc?: string;
}

export interface MenuProfileApiItem {
  menuId: number;
  qrId: number;
  userId: number;
  themeId: string;
  businessName: string;
  slogan?: string;
  chefName?: string | null;
  chefDisplayName?: string | null;
  chefAvatarKey?: string | null;
  chefAvatarUrl?: string | null;
  logoUrl?: string | null;
  phone?: string;
  email?: string;
  address?: string;
  publicUrl: string;
  active: boolean;
  ratingAvg?: number | string | null;
  ratingCount?: number | null;
  userRating?: number | null;
  qr?: MenuQrBriefApiItem | null;
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
  subCategoryId: number;
  subCategorySlug?: string;
  subCategoryName?: string;
  mainCategoryId?: number;
  mainCategorySlug?: string;
  mainCategoryName?: string;
  tags?: MenuTagApiItem[];
  allergens?: MenuAllergenApiItem[];
  sortOrder: number;
  imageUrl?: string;
  available: boolean;
  chefRecommended?: boolean;
  ratingAvg?: number | string;
  ratingCount?: number;
  servesPeopleMin?: number | null;
  servesPeopleMax?: number | null;
  nutrition?: NutritionFacts | null;
}

export interface MenuTagApiItem {
  id: number;
  slug: string;
  name: string;
  sortOrder: number;
}

export interface MenuAllergenApiItem {
  id: number;
  slug: string;
  name: string;
  sortOrder: number;
}

export interface SubCategoryApiItem {
  id: number;
  mainCategoryId: number;
  slug: string;
  name: string;
  sortOrder: number;
}

export interface MainCategoryApiItem {
  id: number;
  slug: string;
  name: string;
  sortOrder: number;
  subs: SubCategoryApiItem[];
}

export interface TaxonomyPageApiResponse {
  content: MainCategoryApiItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  q?: string | null;
}

/** @deprecated legacy tree shape — prefer MainCategoryApiItem */
export interface MenuCategoryApiItem {
  categoryId: number;
  menuId?: number;
  parentId?: number | null;
  name: string;
  sortOrder: number;
  children: MenuCategoryApiItem[];
  slug?: string;
}

export interface PublicMenuApiResponse {
  menu: MenuProfileApiItem;
  products: MenuProductApiItem[];
  categories?: MainCategoryApiItem[];
  themeId: string;
  productPage?: number;
  productSize?: number;
  productTotalElements?: number;
  productHasNext?: boolean;
}

export interface MenuRatingApiResponse {
  menuId?: number;
  ratingAvg?: number | string | null;
  ratingCount?: number | null;
  userRating?: number | null;
}

export interface MenuProductPageApiResponse {
  content: MenuProductApiItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface MenuProductRequestBody {
  name: string;
  description?: string;
  price?: number | string;
  currency?: string;
  subCategoryId: number;
  tagIds?: number[];
  allergenIds?: number[];
  sortOrder?: number;
  imageUrl?: string;
  available?: boolean;
  chefRecommended?: boolean;
  servesPeopleMin?: number | null;
  servesPeopleMax?: number | null;
  nutrition?: NutritionFacts;
}

export interface ProductFacetsApiResponse {
  totalMatching: number;
  tags: Array<{ tagId: number; slug: string; name: string; count: number }>;
  allergens?: Array<{ allergenId: number; slug: string; name: string; count: number }>;
  servesBuckets: Array<{ key: string; label: string; count: number }>;
}

export type PublicProductQuery = {
  page?: number;
  size?: number;
  chefRecommended?: boolean;
  tagSlug?: string;
  minRating?: number | string;
  subCategoryId?: number;
  mainCategoryId?: number;
  tagIds?: number[];
  servesPeople?: number;
  servesPeopleMin?: number;
  servesPeopleMax?: number;
  q?: string;
};

function appendPublicProductParams(params: URLSearchParams, query: PublicProductQuery = {}) {
  if (query.page != null) params.set("page", String(query.page));
  if (query.size != null) params.set("size", String(query.size));
  if (query.chefRecommended != null) params.set("chefRecommended", String(query.chefRecommended));
  if (query.tagSlug) params.set("tagSlug", query.tagSlug);
  if (query.minRating != null) params.set("minRating", String(query.minRating));
  if (query.subCategoryId != null) params.set("subCategoryId", String(query.subCategoryId));
  if (query.mainCategoryId != null) params.set("mainCategoryId", String(query.mainCategoryId));
  if (query.servesPeople != null) params.set("servesPeople", String(query.servesPeople));
  if (query.servesPeopleMin != null) params.set("servesPeopleMin", String(query.servesPeopleMin));
  if (query.servesPeopleMax != null) params.set("servesPeopleMax", String(query.servesPeopleMax));
  if (query.q) params.set("q", query.q);
  for (const tagId of query.tagIds ?? []) {
    params.append("tagIds", String(tagId));
  }
}

export async function getMenuByQrIdRequest(qrId: number | string): Promise<MenuProfileApiItem> {
  const response = await api.get<MenuProfileApiItem>(`/menu/by-qr/${qrId}`);
  return response.data;
}

export interface ActiveMenuSummaryApiItem {
  menuId: number;
  qrId: number;
  businessName?: string | null;
  themeId?: string | null;
  publicUrl?: string | null;
  active: boolean;
  qr?: { id: number; name?: string | null } | null;
}

export async function getMyActiveMenusRequest(): Promise<ActiveMenuSummaryApiItem[]> {
  const response = await api.get<ActiveMenuSummaryApiItem[]>("/menu/my/active");
  return Array.isArray(response.data) ? response.data : [];
}

export interface MenuProductsByQrApiResponse {
  menuId: number;
  qrId: number;
  businessName?: string | null;
  content: MenuProductApiItem[];
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  hasNext?: boolean;
}

export interface MenuCategoriesByQrApiResponse {
  menuId: number;
  qrId: number;
  businessName?: string | null;
  categories: MainCategoryApiItem[];
}

export type MenuProductsByQrQuery = {
  page?: number;
  size?: number;
  q?: string;
  subCategoryId?: number;
};

function applyLocalProductPagination(
  items: MenuProductApiItem[],
  options: MenuProductsByQrQuery = {},
): Pick<MenuProductPageApiResponse, "content" | "page" | "size" | "totalElements" | "totalPages" | "hasNext"> {
  const page = options.page ?? 0;
  const size = options.size ?? 20;
  let filtered = items;
  if (options.q) {
    const q = options.q.toLocaleLowerCase("tr");
    filtered = filtered.filter((product) => product.name.toLocaleLowerCase("tr").includes(q));
  }
  if (options.subCategoryId != null) {
    filtered = filtered.filter((product) => product.subCategoryId === options.subCategoryId);
  }
  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size) || 1);
  const start = page * size;
  const content = filtered.slice(start, start + size);
  return {
    content,
    page,
    size,
    totalElements,
    totalPages,
    hasNext: start + size < totalElements,
  };
}

function normalizeProductPage(
  raw: Partial<MenuProductPageApiResponse> | null | undefined,
  options: MenuProductsByQrQuery = {},
): MenuProductPageApiResponse {
  const page = options.page ?? 0;
  const size = options.size ?? 20;
  const items = Array.isArray(raw?.content) ? raw.content : [];
  if (items.length > size) {
    return applyLocalProductPagination(items, options);
  }
  return {
    content: items,
    page: raw?.page ?? page,
    size: raw?.size ?? size,
    totalElements: raw?.totalElements ?? items.length,
    totalPages: Math.max(1, raw?.totalPages ?? 1),
    hasNext: Boolean(raw?.hasNext),
  };
}

export async function getMenuProductsByQrRequest(
  qrId: number | string,
  options: MenuProductsByQrQuery = {},
): Promise<MenuProductsByQrApiResponse> {
  const params: Record<string, string | number> = {};
  if (options.page != null) params.page = options.page;
  if (options.size != null) params.size = options.size;
  if (options.q) params.q = options.q;
  if (options.subCategoryId != null) params.subCategoryId = options.subCategoryId;

  const response = await api.get<MenuProductsByQrApiResponse>(`/menu/by-qr/${qrId}/products`, {
    params,
  });
  const data = response.data;
  const page = normalizeProductPage(data, options);
  return {
    ...data,
    ...page,
    content: page.content,
  };
}

export async function getMenuProductsPageRequest(
  menuId: number | string,
  options: MenuProductsByQrQuery = {},
): Promise<MenuProductPageApiResponse> {
  const page = options.page ?? 0;
  const size = options.size ?? 20;
  const params: Record<string, string | number> = { page, size };
  if (options.q) params.q = options.q;
  if (options.subCategoryId != null) params.subCategoryId = options.subCategoryId;

  const response = await api.get<MenuProductPageApiResponse>(`/menu/${menuId}/products`, {
    params,
  });
  return normalizeProductPage(response.data, options);
}

export async function getMenuCategoriesByQrRequest(
  qrId: number | string,
): Promise<MenuCategoriesByQrApiResponse> {
  const response = await api.get<MenuCategoriesByQrApiResponse>(`/menu/by-qr/${qrId}/categories`);
  return {
    ...response.data,
    categories: Array.isArray(response.data?.categories) ? response.data.categories : [],
  };
}

export async function getMenuProductsRequest(menuId: number | string): Promise<MenuProductApiItem[]> {
  const products: MenuProductApiItem[] = [];
  let page = 0;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get<MenuProductPageApiResponse>(`/menu/${menuId}/products`, {
      params: { page, size: 50 },
    });
    const data = response.data;
    products.push(...(data.content ?? []));
    hasNext = Boolean(data.hasNext);
    page += 1;
    if (page > 100) break;
  }

  return products;
}

export async function getPublicMenuProductsRequest(
  menuId: number | string,
  pageOrQuery: number | PublicProductQuery = 0,
  size = 20,
): Promise<MenuProductPageApiResponse> {
  const query: PublicProductQuery =
    typeof pageOrQuery === "number"
      ? { page: pageOrQuery, size }
      : { page: 0, size: 20, ...pageOrQuery };
  const params = new URLSearchParams();
  appendPublicProductParams(params, query);
  const response = await fetch(`/api/menu/public/${encodeURIComponent(String(menuId))}/products?${params}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new ApiError(response.status, "Ürünler yüklenemedi");
  }
  return response.json() as Promise<MenuProductPageApiResponse>;
}

export async function getPublicProductFacetsRequest(
  menuId: number | string,
  query: PublicProductQuery = {},
): Promise<ProductFacetsApiResponse> {
  const params = new URLSearchParams();
  appendPublicProductParams(params, query);
  const response = await fetch(
    `/api/menu/public/${encodeURIComponent(String(menuId))}/product-facets?${params}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new ApiError(response.status, "Ürün filtreleri yüklenemedi");
  }
  return response.json() as Promise<ProductFacetsApiResponse>;
}

export async function getPublicProductRecommendationsRequest(
  menuId: number | string,
  productId: number | string,
  limit = 6,
): Promise<MenuProductApiItem[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const response = await fetch(
    `/api/menu/public/${encodeURIComponent(String(menuId))}/products/${encodeURIComponent(String(productId))}/recommendations?${params}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new ApiError(response.status, "Öneriler yüklenemedi");
  }
  const data = (await response.json()) as MenuProductApiItem[];
  return Array.isArray(data) ? data : [];
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

export async function getMenuCategoriesRequest(menuId: number | string): Promise<MainCategoryApiItem[]> {
  const response = await api.get<MainCategoryApiItem[]>(`/menu/${menuId}/categories`);
  return Array.isArray(response.data) ? response.data : [];
}

export async function getMenuTaxonomyRequest(): Promise<MainCategoryApiItem[]> {
  const response = await api.get<MainCategoryApiItem[]>("/menu/taxonomy");
  return Array.isArray(response.data) ? response.data : [];
}

export async function getMenuTaxonomyPageRequest(options?: {
  page?: number;
  size?: number;
  q?: string;
}): Promise<TaxonomyPageApiResponse> {
  const page = options?.page ?? 0;
  const size = options?.size ?? 5;
  const q = options?.q?.trim();
  const response = await api.get<TaxonomyPageApiResponse>("/menu/taxonomy/page", {
    params: { page, size, ...(q ? { q } : {}) },
  });
  return {
    content: Array.isArray(response.data?.content) ? response.data.content : [],
    page: response.data?.page ?? page,
    size: response.data?.size ?? size,
    totalElements: response.data?.totalElements ?? 0,
    totalPages: response.data?.totalPages ?? 0,
    hasNext: Boolean(response.data?.hasNext),
    q: response.data?.q ?? null,
  };
}

export async function getMenuTagsRequest(): Promise<MenuTagApiItem[]> {
  const response = await api.get<MenuTagApiItem[]>("/menu/tags");
  return Array.isArray(response.data) ? response.data : [];
}

export async function getMenuAllergensRequest(): Promise<MenuAllergenApiItem[]> {
  const response = await api.get<MenuAllergenApiItem[]>("/menu/allergens");
  return Array.isArray(response.data) ? response.data : [];
}

export function flattenTaxonomySubs(
  categories: MainCategoryApiItem[],
): Array<{ id: number; label: string; mainCategoryId: number }> {
  return categories.flatMap((main) =>
    (main.subs ?? []).map((sub) => ({
      id: sub.id,
      mainCategoryId: main.id,
      label: `${main.name} / ${sub.name}`,
    })),
  );
}

export function flattenMenuCategories(
  categories: MainCategoryApiItem[],
): Array<{ id: number; label: string }> {
  return flattenTaxonomySubs(categories).map(({ id, label }) => ({ id, label }));
}

export interface MenuUpdateRequestBody {
  themeId?: string;
  businessName?: string;
  slogan?: string;
  chefName?: string | null;
  chefAvatarKey?: string | null;
  logoUrl?: string | null;
  phone?: string;
  email?: string;
  address?: string;
  active?: boolean;
}

export interface ChefAvatarApiItem {
  key: string;
  label: string;
  imageUrl: string;
}

export async function getChefAvatarsRequest(): Promise<ChefAvatarApiItem[]> {
  const response = await api.get<ChefAvatarApiItem[]>("/menu/chef-avatars");
  return response.data ?? [];
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

export async function getPublicMenuRatingRequest(
  identifier: number | string,
): Promise<MenuRatingApiResponse> {
  const response = await fetch(`/api/menu/public/${encodeURIComponent(String(identifier))}/rating`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new ApiError(response.status, "Menü puanı yüklenemedi");
  }
  return response.json() as Promise<MenuRatingApiResponse>;
}

export async function submitPublicMenuRatingRequest(
  identifier: number | string,
  rating: number,
): Promise<MenuRatingApiResponse> {
  const response = await fetch(`/api/menu/public/${encodeURIComponent(String(identifier))}/rating`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating }),
  });
  if (!response.ok) {
    throw new ApiError(response.status, "Menü puanı kaydedilemedi");
  }
  return response.json() as Promise<MenuRatingApiResponse>;
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
  };
}

export async function getUserQrsRequest(
  userId: number | string,
  options?: { includeImage?: boolean; page?: number; size?: number },
): Promise<UserQrPageApiResponse> {
  const includeImage = options?.includeImage === true;
  const page = options?.page ?? 0;
  const size = options?.size ?? 5;
  const response = await api.get<UserQrPageApiResponse>(`/qr/user/${userId}`, {
    params: { includeImage, page, size },
  });
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
