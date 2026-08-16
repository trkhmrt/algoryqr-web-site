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
    expect(buildRegisterTrialUrl("ultimate")).toBe("/register?intent=trial&package=ultimate");
    expect(buildTrialStartUrl("ultimate")).toBe("/dashboard/deneme/baslat?package=ultimate");
  });

  it("normalizes package codes", () => {
    expect(normalizeTrialPackageCode("ultimate")).toBe("ULTIMATE_PACKAGE");
    expect(normalizeTrialPackageCode("ULTIMATE_PACKAGE")).toBe("ULTIMATE_PACKAGE");
  });

  it("resolves trial package id", () => {
    const packages = [pkg(1, "STARTER_PACKAGE"), pkg(2, "ULTIMATE_PACKAGE")];
    expect(resolveTrialPackageId(packages, "ultimate")).toBe(2);
  });

  it("validates same-origin return urls", () => {
    expect(resolveSafeReturnUrl("/dashboard/deneme/baslat?package=ultimate", "https://app.test")).toBe(
      "/dashboard/deneme/baslat?package=ultimate",
    );
    expect(resolveSafeReturnUrl("https://evil.test/path", "https://app.test")).toBeNull();
  });

  it("detects trial register intent", () => {
    expect(isTrialRegisterIntent("trial")).toBe(true);
    expect(isTrialRegisterIntent("register")).toBe(false);
  });
});
