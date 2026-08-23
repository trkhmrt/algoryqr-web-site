import { describe, expect, it } from "vitest";

import { DASHBOARD_ROUTES } from "./dashboard-routes";

describe("trendyol go routes", () => {
  it("exposes partner console paths", () => {
    expect(DASHBOARD_ROUTES.trendyolGo).toBe("/dashboard/trendyol-go");
    expect(DASHBOARD_ROUTES.trendyolGoProducts).toBe("/dashboard/trendyol-go/urunler");
    expect(DASHBOARD_ROUTES.trendyolGoOrders).toBe("/dashboard/trendyol-go/siparisler");
  });
});
