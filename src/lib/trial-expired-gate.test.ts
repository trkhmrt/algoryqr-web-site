import { describe, expect, it } from "vitest";

import {
  isTrialExpiredAllowlistedPath,
  resolveDashboardPathForTrial,
  shouldForceTrialExpiredGate,
} from "./trial-expired-gate";
import { DASHBOARD_ROUTES } from "./dashboard-routes";

describe("trial-expired-gate", () => {
  it("forces gate when trial expired and unpaid", () => {
    expect(shouldForceTrialExpiredGate("TRIAL_EXPIRED", false)).toBe(true);
    expect(shouldForceTrialExpiredGate("TRIAL_EXPIRED", true)).toBe(false);
    expect(shouldForceTrialExpiredGate("ACTIVE", false)).toBe(false);
  });

  it("allowlists package and payment paths", () => {
    expect(isTrialExpiredAllowlistedPath(DASHBOARD_ROUTES.trialExpired)).toBe(true);
    expect(isTrialExpiredAllowlistedPath(DASHBOARD_ROUTES.accountPackages)).toBe(true);
    expect(isTrialExpiredAllowlistedPath(`${DASHBOARD_ROUTES.accountPackages}/x`)).toBe(true);
    expect(isTrialExpiredAllowlistedPath(DASHBOARD_ROUTES.overview)).toBe(false);
  });

  it("resolves post-auth path to trial expired gate", () => {
    expect(resolveDashboardPathForTrial(null, "TRIAL_EXPIRED", false)).toBe(
      DASHBOARD_ROUTES.trialExpired,
    );
    expect(resolveDashboardPathForTrial("/dashboard", "TRIAL_EXPIRED", false)).toBe(
      DASHBOARD_ROUTES.trialExpired,
    );
    expect(resolveDashboardPathForTrial("/dashboard", "TRIAL_EXPIRED", true)).toBe(
      "/dashboard",
    );
    expect(
      resolveDashboardPathForTrial(DASHBOARD_ROUTES.accountPackages, "TRIAL_EXPIRED", false),
    ).toBe(DASHBOARD_ROUTES.accountPackages);
    expect(resolveDashboardPathForTrial(null, "ACTIVE", false)).toBe(DASHBOARD_ROUTES.root);
  });
});
