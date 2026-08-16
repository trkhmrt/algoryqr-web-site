import type { CartItemRequest, OrderResponse } from "@/lib/ordering-api";

export type MenuOwnerSummary = {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

export type MenuWaiterMember = {
  id: number;
  menuId: number;
  username: string;
  displayName: string;
  active: boolean;
  commissionEnabled?: boolean;
  commissionType?: "PERCENT" | "FIXED" | null;
  commissionValue?: number | string | null;
  createdAt?: string | null;
};

export type MenuUsersResponse = {
  owner: MenuOwnerSummary;
  waiters: MenuWaiterMember[];
};

export type MenuCustomerItem = {
  customerId: number;
  menuId?: number | null;
  businessId?: number | null;
  menuName?: string | null;
  menuDeleted?: boolean | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  joinedAt?: string | null;
  memberSince?: string | null;
};

export type WaiterAuthResult = {
  accessToken?: string;
  refreshToken?: string;
  waiterId?: number;
  menuId?: number;
  displayName?: string;
  message?: string;
};

export type WaiterMe = {
  waiterId: number;
  menuId: number;
  ownerUserId?: number;
  username?: string;
  displayName?: string;
  active?: boolean;
  commissionEnabled?: boolean;
  commissionType?: "PERCENT" | "FIXED" | null;
  commissionValue?: number | string | null;
};

export type WaiterTableSummary = {
  tableId: number;
  tableName?: string | null;
  tableNumber?: number | null;
  active: boolean;
  pendingOrderCount: number;
  latestPendingOrderId?: number | null;
  latestPendingStatus?: string | null;
  latestPendingTotal?: number | string | null;
  latestPendingSubmittedAt?: string | null;
  billStatus?: "EMPTY" | "OPEN" | "CLOSED" | null;
  openBillId?: number | null;
  openBillTotal?: number | string | null;
  openBillItemCount?: number | null;
};

export type WaiterBillItem = {
  id: number;
  productId: number;
  productName: string;
  unitPrice?: number | string | null;
  quantity: number;
  lineTotal?: number | string | null;
  note?: string | null;
  sourceOrderId?: number | null;
  addedByWaiterId?: number | null;
  createdAt?: string | null;
};

export type WaiterBill = {
  id: number;
  menuId?: number;
  tableId: number;
  tableName?: string | null;
  status?: "OPEN" | "CLOSED";
  openedByWaiterId?: number | null;
  closedByWaiterId?: number | null;
  openedAt?: string | null;
  closedAt?: string | null;
  totalAmount?: number | string | null;
  currency?: string | null;
  itemCount?: number;
  items?: WaiterBillItem[];
  fixedCommissionAmount?: number | string | null;
  paymentMethod?: "CASH" | "CARD" | null;
};

export type WaiterCommissionRecord = {
  id: number;
  billId?: number | null;
  orderId?: number | null;
  recordType?: "PERCENT_ORDER" | "FIXED_TABLE_CLOSE" | "FIXED_ITEM_ADD";
  baseAmount?: number | string | null;
  commissionValueSnapshot?: number | string | null;
  amount?: number | string | null;
  currency?: string | null;
  tableName?: string | null;
  createdAt?: string | null;
};

export type WaiterTodayCommissionSummary = {
  totalAmount?: number | string | null;
  currency?: string | null;
  percentOrderTotal?: number | string | null;
  fixedTableCloseTotal?: number | string | null;
  fixedItemAddTotal?: number | string | null;
  recordCount?: number;
  records?: WaiterCommissionRecord[];
};

export type WaiterCommissionHistory = {
  records: WaiterCommissionRecord[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type WaiterCatalogProduct = {
  productId: number;
  name: string;
  description?: string | null;
  price?: number | string | null;
  currency?: string | null;
  imageUrl?: string | null;
  available: boolean;
  subCategoryId?: number | null;
  subCategorySlug?: string | null;
  subCategoryName?: string | null;
  mainCategoryId?: number | null;
  mainCategoryName?: string | null;
  commissionEligible?: boolean;
};

export type WaiterCatalogResponse = {
  products: WaiterCatalogProduct[];
  commissionEnabled?: boolean;
  commissionType?: "PERCENT" | "FIXED" | null;
  commissionValue?: number | string | null;
};

export type WaiterCreateOrderRequest = {
  tableId: number;
  items: CartItemRequest[];
  note?: string;
  waiterNote?: string;
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

export class WaiterApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function messageFromUnknown(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "message" in data) {
    const msg = (data as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return fallback;
}

/* ── Merchant: waiters & customers ── */

export async function listMenuUsers(menuId: number): Promise<MenuUsersResponse> {
  const response = await fetch(`/api/waiter-panel/menu/${menuId}/waiters`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<MenuUsersResponse & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Kullanıcılar alınamadı");
  }
  return {
    owner: data.owner,
    waiters: Array.isArray(data.waiters) ? data.waiters : [],
  };
}

export async function createMenuWaiter(
  menuId: number,
  payload: { username: string; password: string; displayName: string },
): Promise<MenuWaiterMember> {
  const response = await fetch(`/api/waiter-panel/menu/${menuId}/waiters`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });
  const data = await parseJson<MenuWaiterMember & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Kullanıcı eklenemedi");
  }
  return data;
}

export async function updateMenuWaiter(
  menuId: number,
  waiterId: number,
  payload: {
    displayName?: string;
    active?: boolean;
    password?: string;
    commissionEnabled?: boolean;
    commissionType?: "PERCENT" | "FIXED";
    commissionValue?: number;
  },
): Promise<MenuWaiterMember> {
  const response = await fetch(`/api/waiter-panel/menu/${menuId}/waiters/${waiterId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });
  const data = await parseJson<MenuWaiterMember & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Kullanıcı güncellenemedi");
  }
  return data;
}

export async function deleteMenuWaiter(menuId: number, waiterId: number): Promise<void> {
  const response = await fetch(`/api/waiter-panel/menu/${menuId}/waiters/${waiterId}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!response.ok && response.status !== 204) {
    const data = await parseJson<{ message?: string }>(response);
    throw new WaiterApiError(response.status, data.message || "Kullanıcı silinemedi");
  }
}

export async function listMenuCustomers(menuId: number): Promise<MenuCustomerItem[]> {
  const response = await fetch(`/api/waiter-panel/menu/${menuId}/customers`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<MenuCustomerItem[] | { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, messageFromUnknown(data, "Müşteriler alınamadı"));
  }
  return Array.isArray(data) ? data : [];
}

export async function listBusinessCustomers(): Promise<MenuCustomerItem[]> {
  const response = await fetch("/api/waiter-panel/customers/my", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<MenuCustomerItem[] | { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, messageFromUnknown(data, "Müşteriler alınamadı"));
  }
  return Array.isArray(data) ? data : [];
}

/* ── Waiter auth ── */

export async function waiterLogin(payload: {
  username: string;
  password: string;
}): Promise<WaiterAuthResult> {
  const response = await fetch("/api/waiter/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    credentials: "same-origin",
  });
  const data = await parseJson<WaiterAuthResult & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Giriş başarısız");
  }
  return data;
}

export async function waiterLogout(): Promise<void> {
  await fetch("/api/waiter/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  }).catch(() => undefined);
}

export async function waiterMe(): Promise<WaiterMe | null> {
  const response = await fetch("/api/waiter/auth/me", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  if (response.status === 401) return null;
  const data = await parseJson<WaiterMe & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Profil alınamadı");
  }
  return data;
}

/* ── Waiter orders ── */

export async function listWaiterPendingOrders(): Promise<OrderResponse[]> {
  const response = await fetch("/api/waiter/orders/pending", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<OrderResponse[] | { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, messageFromUnknown(data, "Siparişler alınamadı"));
  }
  return Array.isArray(data) ? data : [];
}

export async function listWaiterTodayOrders(): Promise<OrderResponse[]> {
  const response = await fetch("/api/waiter/orders/today", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<OrderResponse[] | { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, messageFromUnknown(data, "Siparişler alınamadı"));
  }
  return Array.isArray(data) ? data : [];
}

export async function listWaiterTables(): Promise<WaiterTableSummary[]> {
  const response = await fetch("/api/waiter/orders/tables", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<WaiterTableSummary[] | { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, messageFromUnknown(data, "Masalar alınamadı"));
  }
  return Array.isArray(data) ? data : [];
}

export async function listWaiterTableTodayOrders(tableId: number): Promise<OrderResponse[]> {
  const response = await fetch(`/api/waiter/orders/tables/${tableId}/today`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<OrderResponse[] | { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, messageFromUnknown(data, "Masa siparişleri alınamadı"));
  }
  return Array.isArray(data) ? data : [];
}

export async function confirmWaiterOrder(orderId: number): Promise<OrderResponse> {
  const response = await fetch(`/api/waiter/orders/${orderId}/confirm`, {
    method: "POST",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<OrderResponse & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Sipariş onaylanamadı");
  }
  return data;
}

export async function rejectWaiterOrder(orderId: number): Promise<OrderResponse> {
  const response = await fetch(`/api/waiter/orders/${orderId}/reject`, {
    method: "POST",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<OrderResponse & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Sipariş reddedilemedi");
  }
  return data;
}

export async function cancelWaiterOrder(orderId: number): Promise<OrderResponse> {
  const response = await fetch(`/api/waiter/orders/${orderId}/cancel`, {
    method: "POST",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<OrderResponse & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Sipariş iptal edilemedi");
  }
  return data;
}

export async function getWaiterOrder(orderId: number): Promise<OrderResponse> {
  const response = await fetch(`/api/waiter/orders/${orderId}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<OrderResponse & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Sipariş alınamadı");
  }
  return data;
}

export async function listWaiterCatalog(): Promise<WaiterCatalogResponse> {
  const response = await fetch("/api/waiter/orders/catalog", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<WaiterCatalogResponse & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Menü alınamadı");
  }
  return {
    products: Array.isArray(data.products) ? data.products : [],
    commissionEnabled: data.commissionEnabled,
    commissionType: data.commissionType,
    commissionValue: data.commissionValue,
  };
}

export async function createWaiterOrder(payload: WaiterCreateOrderRequest): Promise<OrderResponse> {
  const response = await fetch("/api/waiter/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });
  const data = await parseJson<OrderResponse & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Sipariş oluşturulamadı");
  }
  return data;
}

export async function updateWaiterOrderNote(
  orderId: number,
  note: string,
): Promise<OrderResponse> {
  const response = await fetch(`/api/waiter/orders/${orderId}/note`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ note }),
  });
  const data = await parseJson<OrderResponse & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Not kaydedilemedi");
  }
  return data;
}

/* ── Waiter bills ── */

export async function getWaiterOpenBill(tableId: number): Promise<WaiterBill> {
  const response = await fetch(`/api/waiter/bills/tables/${tableId}/open`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<WaiterBill & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Adisyon alınamadı");
  }
  return data;
}

export async function addWaiterBillItems(
  billId: number,
  items: CartItemRequest[],
): Promise<WaiterBill> {
  const response = await fetch(`/api/waiter/bills/${billId}/items`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ items }),
  });
  const data = await parseJson<WaiterBill & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Kalemler eklenemedi");
  }
  return data;
}

export async function updateWaiterBillItemQuantity(
  billId: number,
  itemId: number,
  quantity: number,
): Promise<WaiterBill> {
  const response = await fetch(`/api/waiter/bills/${billId}/items/${itemId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ quantity }),
  });
  const data = await parseJson<WaiterBill & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Kalem güncellenemedi");
  }
  return data;
}

export async function removeWaiterBillItem(billId: number, itemId: number): Promise<WaiterBill> {
  const response = await fetch(`/api/waiter/bills/${billId}/items/${itemId}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<WaiterBill & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Kalem silinemedi");
  }
  return data;
}

export async function closeWaiterBill(
  billId: number,
  payload: {
    paymentMethod: "CASH" | "CARD";
    tipReceived?: boolean;
    tipAmount?: number;
  },
): Promise<WaiterBill> {
  const response = await fetch(`/api/waiter/bills/${billId}/close`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });
  const data = await parseJson<WaiterBill & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Masa kapatılamadı");
  }
  return data;
}

/* ── Waiter commissions ── */

export async function getWaiterTodayCommission(): Promise<WaiterTodayCommissionSummary> {
  const response = await fetch("/api/waiter/commissions/today", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<WaiterTodayCommissionSummary & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Komisyon özeti alınamadı");
  }
  return data;
}

export async function getWaiterCommissionHistory(params?: {
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}): Promise<WaiterCommissionHistory> {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.size != null) search.set("size", String(params.size));
  const query = search.toString();
  const response = await fetch(
    `/api/waiter/commissions/history${query ? `?${query}` : ""}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    },
  );
  const data = await parseJson<WaiterCommissionHistory & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Komisyon geçmişi alınamadı");
  }
  return {
    records: Array.isArray(data.records) ? data.records : [],
    page: data.page ?? 0,
    size: data.size ?? 20,
    totalElements: data.totalElements ?? 0,
    totalPages: data.totalPages ?? 0,
  };
}

export type WaiterActiveCampaign = {
  id: number;
  templateCode: string;
  name: string;
  slogan?: string | null;
  targetProductIds?: number[];
};

export type WaiterCampaignCustomer = {
  customerId: number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  member: boolean;
};

export type WaiterManualGrantRequest = {
  email: string;
  campaignId: number;
  action: "ADD_STAMPS" | "GRANT_REWARD" | "LINK_ORDER";
  quantity?: number;
  orderId?: number;
  note: string;
};

export type WaiterManualGrantResponse = {
  message: string;
  currentStamps?: number;
  requiredStamps?: number;
  rewardId?: number;
};

export async function listWaiterActiveCampaigns(
  menuId: number,
): Promise<WaiterActiveCampaign[]> {
  const response = await fetch(
    `/api/waiter/campaigns/active?menuId=${encodeURIComponent(String(menuId))}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    },
  );
  const data = await parseJson<WaiterActiveCampaign[] & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Kampanyalar alınamadı");
  }
  return Array.isArray(data) ? data : [];
}

export async function lookupWaiterCampaignCustomer(
  menuId: number,
  email: string,
): Promise<WaiterCampaignCustomer> {
  const response = await fetch(
    `/api/waiter/campaigns/customers?menuId=${encodeURIComponent(String(menuId))}&email=${encodeURIComponent(email)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    },
  );
  const data = await parseJson<WaiterCampaignCustomer & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Müşteri bulunamadı");
  }
  return data;
}

export async function grantWaiterCampaign(
  menuId: number,
  payload: WaiterManualGrantRequest,
): Promise<WaiterManualGrantResponse> {
  const response = await fetch(
    `/api/waiter/campaigns/grant?menuId=${encodeURIComponent(String(menuId))}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    },
  );
  const data = await parseJson<WaiterManualGrantResponse & { message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Hak tanımlanamadı");
  }
  return data;
}
