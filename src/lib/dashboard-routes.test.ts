import { describe, expect, it } from "vitest";

import {
  DASHBOARD_NAV_ITEMS,
  DASHBOARD_ROUTES,
  isWideDashboardPath,
  splitMobileDashboardNav,
} from "./dashboard-routes";
import { applyListQueryParams } from "@/hooks/use-list-query-state";

describe("dashboard report routes", () => {
  it("builds branch analytics urls", () => {
    expect(DASHBOARD_ROUTES.reportsHub).toBe("/dashboard/raporlar");
    expect(DASHBOARD_ROUTES.digitalMenuAnalyticsForBranch(4)).toBe(
      "/dashboard/dijital-menu/analitik?branch=4",
    );
    expect(DASHBOARD_ROUTES.digitalMenuAnalyticsForBranch(4, 12)).toBe(
      "/dashboard/dijital-menu/analitik?branch=4&qr=12",
    );
  });

});

describe("integrations routes", () => {
  it("exposes hub and partner console paths under Uber Eats", () => {
    expect(DASHBOARD_ROUTES.integrations).toBe("/dashboard/entegrasyonlar");
    expect(DASHBOARD_ROUTES.yemekSepeti).toBe("/dashboard/entegrasyonlar/yemek-sepeti");
    expect(DASHBOARD_ROUTES.uberEats).toBe("/dashboard/uber-eats");
    expect(DASHBOARD_ROUTES.uberEatsProducts).toBe("/dashboard/uber-eats/urunler");
    expect(DASHBOARD_ROUTES.uberEatsOrders).toBe("/dashboard/uber-eats/siparisler");
    expect(DASHBOARD_ROUTES.uberEatsPending).toBe("/dashboard/uber-eats/onay-bekleyen");
    expect(DASHBOARD_ROUTES.uberEatsMenuSync).toBe("/dashboard/uber-eats/menu-senkron");
  });
});

describe("splitMobileDashboardNav", () => {
  it("keeps four primary tabs and puts the rest in overflow", () => {
    const { primary, overflow } = splitMobileDashboardNav(DASHBOARD_NAV_ITEMS);
    expect(primary.map((item) => item.key)).toEqual([
      "overview",
      "orderPanel",
      "digitalMenu",
      "reports",
    ]);
    expect(overflow.map((item) => item.key)).toContain("account");
    expect(overflow.map((item) => item.key)).not.toContain("overview");
  });

  it("fills primary slots when a scoped item is missing", () => {
    const items = DASHBOARD_NAV_ITEMS.filter((item) => item.key !== "orderPanel");
    const { primary } = splitMobileDashboardNav(items);
    expect(primary).toHaveLength(4);
    expect(primary[0].key).toBe("overview");
    expect(primary.map((item) => item.key)).not.toContain("orderPanel");
  });
});

describe("isWideDashboardPath", () => {
  it("widens operational lists and keeps account pages narrow", () => {
    expect(isWideDashboardPath(DASHBOARD_ROUTES.waiter)).toBe(true);
    expect(isWideDashboardPath(DASHBOARD_ROUTES.reservations)).toBe(true);
    expect(isWideDashboardPath(DASHBOARD_ROUTES.account)).toBe(false);
  });
});

describe("applyListQueryParams", () => {
  it("writes, updates, and removes list filters", () => {
    const current = new URLSearchParams("qr=12");
    const next = applyListQueryParams(current, { q: "ali", status: "ACTIVE", empty: "" });
    expect(next.get("qr")).toBe("12");
    expect(next.get("q")).toBe("ali");
    expect(next.get("status")).toBe("ACTIVE");
    expect(next.has("empty")).toBe(false);

    const cleared = applyListQueryParams(next, { q: null, status: undefined });
    expect(cleared.has("q")).toBe(false);
    expect(cleared.has("status")).toBe(false);
    expect(cleared.get("qr")).toBe("12");
  });
});
