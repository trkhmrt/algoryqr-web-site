import { describe, expect, it } from "vitest";

type AccessProfile = {
  activePackage?: string | null;
  products?: string[];
  scopes?: string[];
};

function mergeLiveProfile(
  tokenProfile: AccessProfile,
  live: AccessProfile,
): AccessProfile {
  const liveProducts = Array.isArray(live.products)
    ? live.products.filter((item): item is string => typeof item === "string")
    : [];
  const liveScopes = Array.isArray(live.scopes)
    ? live.scopes.filter((item): item is string => typeof item === "string")
    : [];

  return {
    activePackage: live.activePackage ?? tokenProfile.activePackage ?? null,
    products: [...new Set([...(tokenProfile.products ?? []), ...liveProducts])],
    scopes: [...new Set([...(tokenProfile.scopes ?? []), ...liveScopes])],
  };
}

describe("auth session profile merge", () => {
  it("merges live scopes into stale empty token profile", () => {
    const merged = mergeLiveProfile(
      { products: [], scopes: [] },
      {
        activePackage: "ULTIMATE_PACKAGE",
        products: ["QR_MENU"],
        scopes: ["QR_MENU_OWNER"],
      },
    );

    expect(merged.activePackage).toBe("ULTIMATE_PACKAGE");
    expect(merged.products).toEqual(["QR_MENU"]);
    expect(merged.scopes).toEqual(["QR_MENU_OWNER"]);
  });

  it("keeps token scopes when live profile is empty", () => {
    const merged = mergeLiveProfile(
      {
        activePackage: "PRO_PACKAGE",
        products: ["QR_CREATE"],
        scopes: ["QR_CREATE_OWNER"],
      },
      { products: [], scopes: [] },
    );

    expect(merged.scopes).toEqual(["QR_CREATE_OWNER"]);
  });
});
