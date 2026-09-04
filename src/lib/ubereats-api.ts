import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

export type UberEatsConnectionStatus =
  | "DISCONNECTED"
  | "PENDING_RESTAURANT"
  | "CONNECTED"
  | "ERROR";

export type UberEatsConnection = {
  id: number;
  sellerId: string;
  apiKeyMasked?: string | null;
  restaurantId?: string | null;
  restaurantName?: string | null;
  status: UberEatsConnectionStatus;
  lastError?: string | null;
  lastSyncedAt?: string | null;
  updatedAt?: string | null;
};

export type UberEatsRestaurant = {
  id: string;
  name?: string | null;
  address?: string | null;
};

export type UberEatsProduct = {
  id: string;
  name?: string | null;
  description?: string | null;
  categoryName?: string | null;
  price?: number | null;
  currency?: string | null;
  imageUrl?: string | null;
  available: boolean;
};

export type UberEatsProductPage = {
  content: UberEatsProduct[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type UberEatsOrderItem = {
  productId?: string | null;
  productName?: string | null;
  quantity: number;
  unitPrice?: number | null;
  options?: string | null;
  detail?: string | null;
};

export type UberEatsOrder = {
  id: number;
  externalOrderId: string;
  orderNumber?: string | null;
  deliveryType?: string | null;
  paymentMethod?: string | null;
  packageStatus?: string | null;
  totalAmount?: number | null;
  currency?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  note?: string | null;
  packageCreatedAt?: string | null;
  updatedAt?: string | null;
  items: UberEatsOrderItem[];
};

export type UberEatsOrderPage = {
  content: UberEatsOrder[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type UpsertUberEatsConnectionPayload = {
  sellerId: string;
  apiKey?: string;
  apiSecret?: string;
  restaurantId?: string;
};

export async function listUberEatsConnections() {
  const { data } = await api.get<UberEatsConnection[]>("/integrations/ubereats/connections");
  return data;
}

export async function getUberEatsConnection() {
  try {
    const { data } = await api.get<UberEatsConnection>("/integrations/ubereats/connections/me");
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function upsertUberEatsConnection(payload: UpsertUberEatsConnectionPayload) {
  const { data } = await api.put<UberEatsConnection>("/integrations/ubereats/connections", payload);
  return data;
}

export async function disconnectUberEats() {
  const { data } = await api.delete<UberEatsConnection>("/integrations/ubereats/connections/me");
  return data;
}

export async function listUberEatsRestaurants() {
  const { data } = await api.get<UberEatsRestaurant[]>("/integrations/ubereats/restaurants");
  return data;
}

export async function listUberEatsProducts(q: string, page: number, size = 20) {
  const { data } = await api.get<UberEatsProductPage>("/integrations/ubereats/products", {
    params: { q: q || undefined, page, size },
    timeout: 25_000,
  });
  return data;
}

export async function listUberEatsOrders(
  status: string,
  page: number,
  params?: { from?: string; to?: string; size?: number },
) {
  const { data } = await api.get<UberEatsOrderPage>("/integrations/ubereats/orders", {
    params: {
      status: status || undefined,
      from: params?.from || undefined,
      to: params?.to || undefined,
      page,
      size: params?.size ?? 20,
    },
  });
  return data;
}

export async function syncUberEatsOrders(params?: { from?: string; to?: string }) {
  const { data } = await api.post<{ upserted: number; lookbackHours: number; from?: string; to?: string }>(
    "/integrations/ubereats/orders/sync",
    {},
    {
      params: {
        from: params?.from || undefined,
        to: params?.to || undefined,
      },
      timeout: 60_000,
    },
  );
  return data;
}

export async function acceptUberEatsOrder(orderId: number) {
  const { data } = await api.post<UberEatsOrder>(`/integrations/ubereats/orders/${orderId}/accept`, {});
  return data;
}

export async function rejectUberEatsOrder(orderId: number) {
  const { data } = await api.post<UberEatsOrder>(`/integrations/ubereats/orders/${orderId}/reject`, {});
  return data;
}

export async function cancelUberEatsOrder(orderId: number) {
  const { data } = await api.post<UberEatsOrder>(`/integrations/ubereats/orders/${orderId}/cancel`, {});
  return data;
}

export async function readyUberEatsOrder(orderId: number) {
  const { data } = await api.post<UberEatsOrder>(`/integrations/ubereats/orders/${orderId}/ready`, {});
  return data;
}
