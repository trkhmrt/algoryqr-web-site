import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

export type TrendyolGoConnectionStatus =
  | "DISCONNECTED"
  | "PENDING_RESTAURANT"
  | "CONNECTED"
  | "ERROR";

export type TrendyolGoConnection = {
  id: number;
  branchId: number;
  branchName?: string | null;
  sellerId: string;
  apiKeyMasked?: string | null;
  restaurantId?: string | null;
  restaurantName?: string | null;
  status: TrendyolGoConnectionStatus;
  lastError?: string | null;
  lastSyncedAt?: string | null;
  updatedAt?: string | null;
};

export type TrendyolGoRestaurant = {
  id: string;
  name?: string | null;
  address?: string | null;
};

export type TrendyolGoProduct = {
  id: string;
  name?: string | null;
  description?: string | null;
  categoryName?: string | null;
  price?: number | null;
  currency?: string | null;
  imageUrl?: string | null;
  available: boolean;
};

export type TrendyolGoProductPage = {
  content: TrendyolGoProduct[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type TrendyolGoOrderItem = {
  productId?: string | null;
  productName?: string | null;
  quantity: number;
  unitPrice?: number | null;
  options?: string | null;
};

export type TrendyolGoOrder = {
  id: number;
  externalOrderId: string;
  packageStatus?: string | null;
  totalAmount?: number | null;
  currency?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  note?: string | null;
  packageCreatedAt?: string | null;
  updatedAt?: string | null;
  items: TrendyolGoOrderItem[];
};

export type TrendyolGoOrderPage = {
  content: TrendyolGoOrder[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type UpsertTrendyolGoConnectionPayload = {
  branchId: number;
  sellerId: string;
  apiKey?: string;
  apiSecret?: string;
  restaurantId?: string;
};

export async function listTrendyolGoConnections() {
  const { data } = await api.get<TrendyolGoConnection[]>("/integrations/trendyol-go/connections");
  return data;
}

export async function getTrendyolGoConnection(branchId: number) {
  try {
    const { data } = await api.get<TrendyolGoConnection>(
      `/integrations/trendyol-go/connections/${branchId}`,
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function upsertTrendyolGoConnection(payload: UpsertTrendyolGoConnectionPayload) {
  const { data } = await api.put<TrendyolGoConnection>("/integrations/trendyol-go/connections", payload);
  return data;
}

export async function disconnectTrendyolGo(branchId: number) {
  const { data } = await api.delete<TrendyolGoConnection>(
    `/integrations/trendyol-go/connections/${branchId}`,
  );
  return data;
}

export async function listTrendyolGoRestaurants(branchId: number) {
  const { data } = await api.get<TrendyolGoRestaurant[]>("/integrations/trendyol-go/restaurants", {
    params: { branchId },
  });
  return data;
}

export async function listTrendyolGoProducts(branchId: number, q: string, page: number, size = 20) {
  const { data } = await api.get<TrendyolGoProductPage>("/integrations/trendyol-go/products", {
    params: { branchId, q: q || undefined, page, size },
    timeout: 25_000,
  });
  return data;
}

export async function listTrendyolGoOrders(branchId: number, status: string, page: number, size = 20) {
  const { data } = await api.get<TrendyolGoOrderPage>("/integrations/trendyol-go/orders", {
    params: { branchId, status: status || undefined, page, size },
  });
  return data;
}

export async function getTrendyolGoOrder(branchId: number, orderId: number) {
  const { data } = await api.get<TrendyolGoOrder>(`/integrations/trendyol-go/orders/${orderId}`, {
    params: { branchId },
  });
  return data;
}

export async function acceptTrendyolGoOrder(branchId: number, orderId: number) {
  const { data } = await api.post<TrendyolGoOrder>(
    `/integrations/trendyol-go/orders/${orderId}/accept`,
    {},
    { params: { branchId } },
  );
  return data;
}

export async function rejectTrendyolGoOrder(branchId: number, orderId: number) {
  const { data } = await api.post<TrendyolGoOrder>(
    `/integrations/trendyol-go/orders/${orderId}/reject`,
    {},
    { params: { branchId } },
  );
  return data;
}

export async function cancelTrendyolGoOrder(branchId: number, orderId: number) {
  const { data } = await api.post<TrendyolGoOrder>(
    `/integrations/trendyol-go/orders/${orderId}/cancel`,
    {},
    { params: { branchId } },
  );
  return data;
}

export async function readyTrendyolGoOrder(branchId: number, orderId: number) {
  const { data } = await api.post<TrendyolGoOrder>(
    `/integrations/trendyol-go/orders/${orderId}/ready`,
    {},
    { params: { branchId } },
  );
  return data;
}
