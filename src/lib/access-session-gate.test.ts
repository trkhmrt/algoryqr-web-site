import { describe, expect, it } from "vitest";

import { destinationForDecision, parseAccessSession } from "./access-session-gate";
import { DASHBOARD_ROUTES } from "./dashboard-routes";

describe("access-session-gate", () => {
  it("maps decisions to dashboard paths", () => {
    expect(destinationForDecision("START_PACKAGE", null)).toBe(DASHBOARD_ROUTES.trialStart);
    expect(destinationForDecision("REQUIRE_PURCHASE", null)).toBe(DASHBOARD_ROUTES.accountPackages);
    expect(destinationForDecision("REQUIRE_PAYMENT", null)).toBe(DASHBOARD_ROUTES.accountPackages);
    expect(destinationForDecision("ALLOW", "/dashboard/dijital-menu")).toBe("/dashboard/dijital-menu");
    expect(destinationForDecision("ALLOW", null)).toBe(DASHBOARD_ROUTES.root);
  });

  it("keeps purchase and start allowlisted return paths", () => {
    expect(destinationForDecision("REQUIRE_PURCHASE", DASHBOARD_ROUTES.accountPackages)).toBe(
      DASHBOARD_ROUTES.accountPackages,
    );
    expect(destinationForDecision("START_PACKAGE", DASHBOARD_ROUTES.trialStart)).toBe(
      DASHBOARD_ROUTES.trialStart,
    );
    expect(destinationForDecision("REQUIRE_PAYMENT", "/dashboard")).toBe(DASHBOARD_ROUTES.accountPackages);
  });

  it("parses session payloads", () => {
    expect(parseAccessSession({ decision: "ALLOW", packageCode: "ULTIMATE_PACKAGE" })).toEqual({
      decision: "ALLOW",
      packageCode: "ULTIMATE_PACKAGE",
      endsAt: null,
      debtDueAt: null,
      messageKey: null,
      code: null,
    });
    expect(parseAccessSession({ decision: "NOPE" })).toBeNull();
  });
});
