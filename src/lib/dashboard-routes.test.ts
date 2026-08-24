import { describe, expect, it } from "vitest";

import { DASHBOARD_ROUTES } from "./dashboard-routes";

describe("dashboard report routes", () => {
  it("builds branch analytics urls", () => {
    expect(DASHBOARD_ROUTES.digitalMenuAnalyticsForBranch(4)).toBe(
      "/dashboard/dijital-menu/analitik?branch=4",
    );
    expect(DASHBOARD_ROUTES.digitalMenuAnalyticsForBranch(4, 12)).toBe(
      "/dashboard/dijital-menu/analitik?branch=4&qr=12",
    );
  });

  it("builds branch order report urls", () => {
    expect(DASHBOARD_ROUTES.orderPanelReportsForBranch(4)).toBe(
      "/dashboard/siparis-paneli/raporlar?branch=4",
    );
    expect(DASHBOARD_ROUTES.orderPanelReportsForBranch(4, 12)).toBe(
      "/dashboard/siparis-paneli/raporlar?branch=4&qr=12",
    );
  });
});

describe("trendyol go routes", () => {
  it("exposes partner console paths", () => {
    expect(DASHBOARD_ROUTES.trendyolGo).toBe("/dashboard/trendyol-go");
    expect(DASHBOARD_ROUTES.trendyolGoProducts).toBe("/dashboard/trendyol-go/urunler");
    expect(DASHBOARD_ROUTES.trendyolGoOrders).toBe("/dashboard/trendyol-go/siparisler");
  });
});
