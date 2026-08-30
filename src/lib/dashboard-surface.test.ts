import { describe, expect, it } from "vitest";

import {
  DASHBOARD_HUB_GRID,
  DASHBOARD_SURFACE,
  DASHBOARD_TILE_SQUARE,
  DASHBOARD_TYPE_HINT,
  DASHBOARD_TYPE_KPI,
  DASHBOARD_TYPE_META,
  DASHBOARD_TYPE_SECTION,
  DASHBOARD_TYPE_TILE,
  DASHBOARD_TYPE_TITLE,
  DASHBOARD_PANEL_LG,
} from "./dashboard-surface";

describe("dashboard-surface", () => {
  it("matches the branch square card chrome", () => {
    expect(DASHBOARD_TILE_SQUARE).toBe(
      "group flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-none transition-colors hover:bg-muted/50 dark:border-border dark:bg-card",
    );
    expect(DASHBOARD_SURFACE).toContain("border-[#e5e7eb]");
    expect(DASHBOARD_SURFACE).toContain("bg-white");
    expect(DASHBOARD_HUB_GRID).toContain("grid-cols-2");
  });

  it("keeps the closed type scale", () => {
    expect(DASHBOARD_TYPE_TITLE).toContain("text-2xl");
    expect(DASHBOARD_TYPE_SECTION).toContain("text-base");
    expect(DASHBOARD_TYPE_HINT).toContain("text-sm");
    expect(DASHBOARD_TYPE_TILE).toContain("text-sm");
    expect(DASHBOARD_TYPE_META).toContain("text-xs");
    expect(DASHBOARD_TYPE_KPI).toContain("text-3xl");
    expect(DASHBOARD_PANEL_LG).toContain("border-[#e5e7eb]");
    expect(DASHBOARD_PANEL_LG).toContain("p-6");
  });
});
