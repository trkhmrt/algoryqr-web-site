export type TableSessionResponse = {
  sessionToken: string;
  tableId: number;
  menuId: number;
  tableName: string;
  expiresAt?: string | null;
};

export type OrderItemResponse = {
  id?: number;
  productId: number;
  productName?: string;
  unitPrice?: number | string;
  quantity: number;
  note?: string | null;
  lineTotal?: number | string;
};

export type OrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | string;

export type OrderResponse = {
  id: number;
  menuId?: number;
  tableId?: number;
  tableName?: string | null;
  tableSessionId?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  customerEmail?: string | null;
  status: OrderStatus;
  totalAmount?: number | string | null;
  currency?: string | null;
  note?: string | null;
  waiterId?: number | null;
  waiterName?: string | null;
  waiterNote?: string | null;
  billId?: number | null;
  commissionAmount?: number | string | null;
  items?: OrderItemResponse[];
  submittedAt?: string | null;
  confirmedAt?: string | null;
  rejectedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  campaignSummary?: {
    campaignProductCount?: number;
    guestOrder?: boolean;
    rewardEligible?: boolean;
    hint?: string | null;
  } | null;
};

export type CartItemRequest = {
  productId: number;
  quantity: number;
  note?: string;
};

export type UpdateCartRequest = {
  items: CartItemRequest[];
  note?: string;
};

export type RestaurantTable = {
  id: number;
  menuId: number;
  name: string;
  tableNumber?: number | null;
  publicToken: string;
  publicUrl?: string | null;
  qrImageBase64?: string | null;
  active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
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

export class OrderingApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function sessionHeaders(sessionToken: string): HeadersInit {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Table-Session": sessionToken,
  };
}

export async function openTableSession(
  identifier: string,
  tableToken?: string | null,
): Promise<TableSessionResponse> {
  const response = await fetch(`/api/menu/public/${encodeURIComponent(identifier)}/table-session`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(tableToken ? { tableToken } : {}),
  });
  const data = await parseJson<TableSessionResponse & { message?: string }>(response);
  if (!response.ok) {
    throw new OrderingApiError(response.status, data.message || "Masa oturumu açılamadı");
  }
  return data;
}

export async function getCart(identifier: string, sessionToken: string): Promise<OrderResponse> {
  const response = await fetch(`/api/menu/public/${encodeURIComponent(identifier)}/cart`, {
    method: "GET",
    headers: sessionHeaders(sessionToken),
  });
  const data = await parseJson<OrderResponse & { message?: string }>(response);
  if (!response.ok) {
    throw new OrderingApiError(response.status, data.message || "Sepet alınamadı");
  }
  return data;
}

export async function putCart(
  identifier: string,
  sessionToken: string,
  payload: UpdateCartRequest,
): Promise<OrderResponse> {
  const response = await fetch(`/api/menu/public/${encodeURIComponent(identifier)}/cart`, {
    method: "PUT",
    headers: sessionHeaders(sessionToken),
    body: JSON.stringify(payload),
  });
  const data = await parseJson<OrderResponse & { message?: string }>(response);
  if (!response.ok) {
    throw new OrderingApiError(response.status, data.message || "Sepet güncellenemedi");
  }
  return data;
}

export async function submitOrder(
  identifier: string,
  sessionToken: string,
): Promise<OrderResponse> {
  const response = await fetch(
    `/api/menu/public/${encodeURIComponent(identifier)}/orders/submit`,
    {
      method: "POST",
      headers: sessionHeaders(sessionToken),
      credentials: "same-origin",
    },
  );
  const data = await parseJson<OrderResponse & { message?: string }>(response);
  if (!response.ok) {
    throw new OrderingApiError(response.status, data.message || "Sipariş gönderilemedi");
  }
  return data;
}

export async function getOrder(
  identifier: string,
  sessionToken: string,
  orderId: number | string,
): Promise<OrderResponse> {
  const response = await fetch(
    `/api/menu/public/${encodeURIComponent(identifier)}/orders/${encodeURIComponent(String(orderId))}`,
    {
      method: "GET",
      headers: sessionHeaders(sessionToken),
    },
  );
  const data = await parseJson<OrderResponse & { message?: string }>(response);
  if (!response.ok) {
    throw new OrderingApiError(response.status, data.message || "Sipariş alınamadı");
  }
  return data;
}

export async function getCustomerOrders(menuId: number): Promise<OrderResponse[]> {
  const response = await fetch(`/api/customer/orders?menuId=${encodeURIComponent(String(menuId))}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<OrderResponse[] | { message?: string }>(response);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && !Array.isArray(data) && "message" in data
        ? String(data.message)
        : "Siparişler alınamadı";
    throw new OrderingApiError(response.status, message);
  }
  return Array.isArray(data) ? data : [];
}

export async function getCustomerOrder(orderId: number | string): Promise<OrderResponse> {
  const response = await fetch(`/api/customer/orders/${encodeURIComponent(String(orderId))}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<OrderResponse & { message?: string }>(response);
  if (!response.ok) {
    throw new OrderingApiError(response.status, data.message || "Sipariş alınamadı");
  }
  return data;
}

export async function listMenuTables(menuId: number): Promise<RestaurantTable[]> {
  const response = await fetch(`/api/waiter-panel/menu/${menuId}/tables`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<RestaurantTable[] | { message?: string }>(response);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && !Array.isArray(data) && "message" in data
        ? String(data.message)
        : "Masalar alınamadı";
    throw new OrderingApiError(response.status, message);
  }
  return Array.isArray(data) ? data : [];
}

export async function createMenuTable(
  menuId: number,
  payload: { name: string; tableNumber?: number | null },
): Promise<RestaurantTable> {
  const response = await fetch(`/api/waiter-panel/menu/${menuId}/tables`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });
  const data = await parseJson<RestaurantTable & { message?: string }>(response);
  if (!response.ok) {
    throw new OrderingApiError(response.status, data.message || "Masa eklenemedi");
  }
  return data;
}

export async function updateMenuTable(
  menuId: number,
  tableId: number,
  payload: { name?: string; tableNumber?: number | null; active?: boolean },
): Promise<RestaurantTable> {
  const response = await fetch(`/api/waiter-panel/menu/${menuId}/tables/${tableId}`, {
    method: "PATCH",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });
  const data = await parseJson<RestaurantTable & { message?: string }>(response);
  if (!response.ok) {
    throw new OrderingApiError(response.status, data.message || "Masa güncellenemedi");
  }
  return data;
}

export async function regenerateMenuTableQr(
  menuId: number,
  tableId: number,
): Promise<RestaurantTable> {
  const response = await fetch(`/api/waiter-panel/menu/${menuId}/tables/${tableId}/regenerate-qr`, {
    method: "POST",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<RestaurantTable & { message?: string }>(response);
  if (!response.ok) {
    throw new OrderingApiError(response.status, data.message || "QR yenilenemedi");
  }
  return data;
}

export async function deleteMenuTable(menuId: number, tableId: number): Promise<void> {
  const response = await fetch(`/api/waiter-panel/menu/${menuId}/tables/${tableId}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!response.ok && response.status !== 204) {
    const data = await parseJson<{ message?: string }>(response);
    throw new OrderingApiError(response.status, data.message || "Masa silinemedi");
  }
}

export async function listMerchantOrders(
  menuId: number,
  status = "SUBMITTED",
): Promise<OrderResponse[]> {
  const params = new URLSearchParams({ status });
  const response = await fetch(`/api/waiter-panel/menu/${menuId}/orders?${params}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<OrderResponse[] | { message?: string }>(response);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && !Array.isArray(data) && "message" in data
        ? String(data.message)
        : "Siparişler alınamadı";
    throw new OrderingApiError(response.status, message);
  }
  return Array.isArray(data) ? data : [];
}

export async function confirmMerchantOrder(
  menuId: number,
  orderId: number,
): Promise<OrderResponse> {
  const response = await fetch(`/api/waiter-panel/menu/${menuId}/orders/${orderId}/confirm`, {
    method: "POST",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<OrderResponse & { message?: string }>(response);
  if (!response.ok) {
    throw new OrderingApiError(response.status, data.message || "Sipariş onaylanamadı");
  }
  return data;
}

export async function rejectMerchantOrder(
  menuId: number,
  orderId: number,
): Promise<OrderResponse> {
  const response = await fetch(`/api/waiter-panel/menu/${menuId}/orders/${orderId}/reject`, {
    method: "POST",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson<OrderResponse & { message?: string }>(response);
  if (!response.ok) {
    throw new OrderingApiError(response.status, data.message || "Sipariş reddedilemedi");
  }
  return data;
}
