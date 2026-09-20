import { createMarketplaceIntegrationApi } from "@/lib/marketplace-integration-api";

export type {
  MarketplaceConnection as YemekSepetiConnection,
  MarketplaceConnectionStatus as YemekSepetiConnectionStatus,
  MarketplaceOrder as YemekSepetiOrder,
  MarketplaceOrderItem as YemekSepetiOrderItem,
  MarketplaceOrderPage as YemekSepetiOrderPage,
  MarketplaceRestaurant as YemekSepetiRestaurant,
  UpsertMarketplaceConnectionPayload as UpsertYemekSepetiConnectionPayload,
} from "@/lib/marketplace-integration-api";

const client = createMarketplaceIntegrationApi("/integrations/yemek-sepeti");

export const getYemekSepetiConnection = client.getConnection;
export const upsertYemekSepetiConnection = client.upsertConnection;
export const disconnectYemekSepeti = client.disconnect;
export const listYemekSepetiRestaurants = client.listRestaurants;
export const listYemekSepetiOrders = client.listOrders;
export const syncYemekSepetiOrders = client.syncOrders;
export const acceptYemekSepetiOrder = client.acceptOrder;
export const rejectYemekSepetiOrder = client.rejectOrder;
export const cancelYemekSepetiOrder = client.cancelOrder;
export const readyYemekSepetiOrder = client.readyOrder;
