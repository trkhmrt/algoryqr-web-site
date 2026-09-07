import { describe, expect, it } from "vitest";

import type { PlanPackageApiItem } from "./api";
import {
  buildRegisterTrialUrl,
  buildTrialStartUrl,
  isTrialRegisterIntent,
  normalizeTrialPackageCode,
  resolveSafeReturnUrl,
  resolveTrialPackageId,
} from "./trial-flow";

function pkg(id: number, code: string): PlanPackageApiItem {
  return {
    id,
    code,
    name: code,
    description: "",
    price: 0,
    currency: "TRY",
    active: true,
    validityDays: 30,
    items: [],
  };
}

describe("trial-flow", () => {
  it("builds register and trial start urls", () => {
    expect(buildRegisterTrialUrl("ultimate-trial")).toBe(
      "/register?intent=trial&package=ultimate-trial",
    );
    expect(buildTrialStartUrl("ultimate-trial")).toBe(
      "/dashboard/deneme/baslat?package=ultimate-trial",
    );
  });

  it("normalizes package codes", () => {
    expect(normalizeTrialPackageCode("ultimate-trial")).toBe("ULTIMATE_TRIAL_PACKAGE");
    expect(normalizeTrialPackageCode("ultimate_trial_package")).toBe("ULTIMATE_TRIAL_PACKAGE");
    expect(normalizeTrialPackageCode("ultimate")).toBe("ULTIMATE_TRIAL_PACKAGE");
    expect(normalizeTrialPackageCode("ULTIMATE_TRIAL_PACKAGE")).toBe("ULTIMATE_TRIAL_PACKAGE");
  });

  it("resolves trial package id", () => {
    const packages = [pkg(1, "STARTER_PACKAGE"), pkg(2, "ULTIMATE_TRIAL_PACKAGE")];
    expect(resolveTrialPackageId(packages, "ultimate-trial")).toBe(2);
  });

  it("validates same-origin return urls", () => {
    expect(
      resolveSafeReturnUrl("/dashboard/deneme/baslat?package=ultimate-trial", "https://app.test"),
    ).toBe("/dashboard/deneme/baslat?package=ultimate-trial");
    expect(resolveSafeReturnUrl("https://evil.test/path", "https://app.test")).toBeNull();
  });

  it("detects trial register intent", () => {
    expect(isTrialRegisterIntent("trial")).toBe(true);
    expect(isTrialRegisterIntent("register")).toBe(false);
  });
});
