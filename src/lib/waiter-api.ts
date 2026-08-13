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
  createdAt?: string | null;
};

export type MenuUsersResponse = {
  owner: MenuOwnerSummary;
  waiters: MenuWaiterMember[];
};

export type MenuCustomerItem = {
  customerId: number;
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
  subCategoryName?: string | null;
  mainCategoryId?: number | null;
  mainCategoryName?: string | null;
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
  const response = await fetch(`/api/menu/${menuId}/waiters`, {
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
  const response = await fetch(`/api/menu/${menuId}/waiters`, {
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
  payload: { displayName?: string; active?: boolean; password?: string },
): Promise<MenuWaiterMember> {
  const response = await fetch(`/api/menu/${menuId}/waiters/${waiterId}`, {
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
  const response = await fetch(`/api/menu/${menuId}/waiters/${waiterId}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!response.ok && response.status !== 204) {
    const data = await parseJson<{ message?: string }>(response);
    throw new WaiterApiError(response.status, data.message || "Kullanıcı silinemedi");
  }
}

export async function listMenuCustomers(menuId: number): Promise<MenuCustomerItem[]> {
  const response = await fetch(`/api/menu/${menuId}/customers`, {
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

export async function listWaiterCatalog(): Promise<WaiterCatalogProduct[]> {
  const response = await fetch("/api/waiter/orders/catalog", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<{ products?: WaiterCatalogProduct[]; message?: string }>(response);
  if (!response.ok) {
    throw new WaiterApiError(response.status, data.message || "Menü alınamadı");
  }
  return Array.isArray(data.products) ? data.products : [];
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
