import { describe, expect, it } from "vitest";

import { resolveMenuGuestDefaults } from "./menu-guest-defaults";

describe("resolveMenuGuestDefaults", () => {
  it("uses English and USD for Aya Roof style menus", () => {
    expect(
      resolveMenuGuestDefaults({
        publicId: "aya-roof",
        businessName: "Aya Roof Lounge",
      }),
    ).toEqual({ locale: "en", currency: "USD" });
  });

  it("uses Turkish and TRY for Ulas Bayram style menus", () => {
    expect(
      resolveMenuGuestDefaults({
        publicId: "ulasbayram",
        businessName: "Paradise Restaurant",
        identifier: "ulasbayram",
      }),
    ).toEqual({ locale: "tr", currency: "TRY" });
  });

  it("falls back to Turkish and TRY for unknown menus", () => {
    expect(
      resolveMenuGuestDefaults({
        publicId: "limon",
        businessName: "Limon Restaurant",
      }),
    ).toEqual({ locale: "tr", currency: "TRY" });
  });
});
