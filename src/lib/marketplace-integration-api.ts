import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

export type MarketplaceConnectionStatus =
  | "DISCONNECTED"
  | "PENDING_RESTAURANT"
  | "CONNECTED"
  | "ERROR";

export type MarketplaceConnection = {
  id: number;
  sellerId: string;
  apiKeyMasked?: string | null;
  restaurantId?: string | null;
  restaurantName?: string | null;
  status: MarketplaceConnectionStatus;
  lastError?: string | null;
  lastSyncedAt?: string | null;
  updatedAt?: string | null;
};

export type MarketplaceRestaurant = {
  id: string;
  name?: string | null;
  address?: string | null;
};

export type MarketplaceProduct = {
  id: string;
  name?: string | null;
  description?: string | null;
  categoryName?: string | null;
  price?: number | null;
  currency?: string | null;
  imageUrl?: string | null;
  available: boolean;
};

export type MarketplaceProductPage = {
  content: MarketplaceProduct[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type MarketplaceModifierOptionPayload = {
  name: string;
  price: number;
};

export type MarketplaceModifierGroupPayload = {
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  options: MarketplaceModifierOptionPayload[];
};

export type CreateMarketplaceProductPayload = {
  name: string;
  description?: string;
  price: number;
  currency: string;
  categoryName: string;
  imageUrl?: string;
  available: boolean;
  modifierGroups: MarketplaceModifierGroupPayload[];
};

export type MarketplaceOrderItem = {
  productId?: string | null;
  productName?: string | null;
  quantity: number;
  unitPrice?: number | null;
  options?: string | null;
  detail?: string | null;
};

export type MarketplaceOrder = {
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
  items: MarketplaceOrderItem[];
};

export type MarketplaceOrderPage = {
  content: MarketplaceOrder[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type UpsertMarketplaceConnectionPayload = {
  sellerId: string;
  apiKey?: string;
  apiSecret?: string;
  restaurantId?: string;
};

export type MarketplaceIntegrationApi = {
  listConnections: () => Promise<MarketplaceConnection[]>;
  getConnection: () => Promise<MarketplaceConnection | null>;
  upsertConnection: (payload: UpsertMarketplaceConnectionPayload) => Promise<MarketplaceConnection>;
  disconnect: () => Promise<MarketplaceConnection>;
  listRestaurants: () => Promise<MarketplaceRestaurant[]>;
  listProducts: (q: string, page: number, size?: number) => Promise<MarketplaceProductPage>;
  createProduct: (payload: CreateMarketplaceProductPayload) => Promise<MarketplaceProduct>;
  listOrders: (
    status: string,
    page: number,
    params?: { from?: string; to?: string; size?: number },
  ) => Promise<MarketplaceOrderPage>;
  syncOrders: (params?: { from?: string; to?: string }) => Promise<{
    upserted: number;
    lookbackHours: number;
    from?: string;
    to?: string;
  }>;
  acceptOrder: (orderId: number) => Promise<MarketplaceOrder>;
  rejectOrder: (orderId: number) => Promise<MarketplaceOrder>;
  cancelOrder: (orderId: number) => Promise<MarketplaceOrder>;
  readyOrder: (orderId: number) => Promise<MarketplaceOrder>;
};

export function createMarketplaceIntegrationApi(basePath: string): MarketplaceIntegrationApi {
  const prefix = basePath.replace(/\/$/, "");

  return {
    async listConnections() {
      const { data } = await api.get<MarketplaceConnection[]>(`${prefix}/connections`);
      return data;
    },

    async getConnection() {
      try {
        const { data } = await api.get<MarketplaceConnection>(`${prefix}/connections/me`);
        return data;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },

    async upsertConnection(payload) {
      const { data } = await api.put<MarketplaceConnection>(`${prefix}/connections`, payload);
      return data;
    },

    async disconnect() {
      const { data } = await api.delete<MarketplaceConnection>(`${prefix}/connections/me`);
      return data;
    },

    async listRestaurants() {
      const { data } = await api.get<MarketplaceRestaurant[]>(`${prefix}/restaurants`);
      return data;
    },

    async listProducts(q, page, size = 20) {
      const { data } = await api.get<MarketplaceProductPage>(`${prefix}/products`, {
        params: { q: q || undefined, page, size },
        timeout: 25_000,
      });
      return data;
    },

    async createProduct(payload) {
      const { data } = await api.post<MarketplaceProduct>(`${prefix}/products`, payload, {
        timeout: 25_000,
      });
      return data;
    },

    async listOrders(status, page, params) {
      const { data } = await api.get<MarketplaceOrderPage>(`${prefix}/orders`, {
        params: {
          status: status || undefined,
          from: params?.from || undefined,
          to: params?.to || undefined,
          page,
          size: params?.size ?? 20,
        },
      });
      return data;
    },

    async syncOrders(params) {
      const { data } = await api.post<{
        upserted: number;
        lookbackHours: number;
        from?: string;
        to?: string;
      }>(`${prefix}/orders/sync`, {}, {
        params: {
          from: params?.from || undefined,
          to: params?.to || undefined,
        },
        timeout: 60_000,
      });
      return data;
    },

    async acceptOrder(orderId) {
      const { data } = await api.post<MarketplaceOrder>(`${prefix}/orders/${orderId}/accept`, {});
      return data;
    },

    async rejectOrder(orderId) {
      const { data } = await api.post<MarketplaceOrder>(`${prefix}/orders/${orderId}/reject`, {});
      return data;
    },

    async cancelOrder(orderId) {
      const { data } = await api.post<MarketplaceOrder>(`${prefix}/orders/${orderId}/cancel`, {});
      return data;
    },

    async readyOrder(orderId) {
      const { data } = await api.post<MarketplaceOrder>(`${prefix}/orders/${orderId}/ready`, {});
      return data;
    },
  };
}
