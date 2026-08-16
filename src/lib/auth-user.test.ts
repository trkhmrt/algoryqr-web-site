import { describe, expect, it } from "vitest";

import { getAccessProfileFromToken, hasScope } from "./auth-user";

function encodePayload(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function buildToken(payload: Record<string, unknown>): string {
  return `header.${encodePayload(payload)}.signature`;
}

describe("auth-user access profile", () => {
  it("returns empty products and scopes when token claims are empty", () => {
    const profile = getAccessProfileFromToken(
      buildToken({
        activePackage: null,
        products: [],
        scopes: [],
        roles: ["ROLE_USER"],
      }),
    );

    expect(profile.products).toEqual([]);
    expect(profile.scopes).toEqual([]);
    expect(hasScope(profile, "QR_MENU_OWNER")).toBe(false);
  });

  it("maps token products and scopes for menu access", () => {
    const profile = getAccessProfileFromToken(
      buildToken({
        activePackage: "ULTIMATE_PACKAGE",
        products: ["QR_MENU", "QR_CREATE"],
        scopes: ["QR_MENU_OWNER", "QR_CREATE_OWNER"],
        roles: ["ROLE_USER"],
      }),
    );

    expect(profile.activePackage).toBe("ULTIMATE_PACKAGE");
    expect(hasScope(profile, "QR_MENU_OWNER")).toBe(true);
    expect(hasScope(profile, "WAITER_PANEL_OWNER")).toBe(false);
  });

  it("treats QR_ANALYTICS_OWNER as SMART_REPORTING_OWNER", () => {
    const profile = getAccessProfileFromToken(
      buildToken({
        products: ["QR_ANALYTICS"],
        scopes: ["QR_ANALYTICS_OWNER"],
      }),
    );

    expect(hasScope(profile, "SMART_REPORTING_OWNER")).toBe(true);
  });
});
