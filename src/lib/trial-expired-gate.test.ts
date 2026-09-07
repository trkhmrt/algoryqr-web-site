import { describe, expect, it } from "vitest";

import {
  isTrialExpiredAllowlistedPath,
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
});
