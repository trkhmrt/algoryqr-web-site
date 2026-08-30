import { describe, expect, it } from "vitest";

import { DASHBOARD_ROUTES } from "./dashboard-routes";
import { buildSetupSteps, isSetupComplete, nextSetupStep } from "./dashboard-setup";

describe("buildSetupSteps", () => {
  it("starts with card when no payment method exists", () => {
    const steps = buildSetupSteps({
      hasCard: false,
      canOperate: false,
      branchCount: 0,
      totalMenus: 0,
      liveMenus: 0,
    });
    expect(nextSetupStep(steps)?.id).toBe("card");
    expect(nextSetupStep(steps)?.href).toBe(DASHBOARD_ROUTES.trialStart);
    expect(isSetupComplete(steps)).toBe(false);
  });

  it("keeps card step open until the workspace is usable", () => {
    const steps = buildSetupSteps({
      hasCard: true,
      canOperate: false,
      branchCount: 0,
      totalMenus: 0,
      liveMenus: 0,
    });
    expect(nextSetupStep(steps)?.id).toBe("card");
    expect(isSetupComplete(steps)).toBe(false);
  });

  it("marks the first incomplete product step as next", () => {
    const steps = buildSetupSteps({
      hasCard: true,
      canOperate: true,
      branchCount: 1,
      totalMenus: 0,
      liveMenus: 0,
    });
    expect(steps[0].done).toBe(true);
    expect(nextSetupStep(steps)?.id).toBe("menu");
    expect(isSetupComplete(steps)).toBe(false);
  });

  it("completes when a live menu exists", () => {
    const steps = buildSetupSteps({
      hasCard: true,
      canOperate: true,
      branchCount: 1,
      totalMenus: 2,
      liveMenus: 1,
    });
    expect(isSetupComplete(steps)).toBe(true);
    expect(nextSetupStep(steps)).toBeNull();
    expect(steps[3].href).toBe(DASHBOARD_ROUTES.digitalMenuMenus);
  });
});
