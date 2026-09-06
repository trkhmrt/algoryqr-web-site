import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  detectMenuDeviceType,
  getOrCreateMenuSessionId,
  nextMenuEventSequence,
  postMenuAnalyticsEvents,
} from "./menu-analytics";

function installBrowserStubs(userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)") {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    clear: () => store.clear(),
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
  vi.stubGlobal("window", {
    localStorage,
    matchMedia: () => ({ matches: false }),
  });
  vi.stubGlobal("localStorage", localStorage);
  vi.stubGlobal("navigator", { userAgent, sendBeacon: undefined as unknown });
  return store;
}

describe("menu-analytics", () => {
  beforeEach(() => {
    installBrowserStubs();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("getOrCreateMenuSessionId_reusesStoredUuid", () => {
    const first = getOrCreateMenuSessionId("pub-42");
    const second = getOrCreateMenuSessionId("pub-42");
    expect(second).toBe(first);
    expect(window.localStorage.getItem("algory_menu_sid_pub-42")).toBe(first);
  });

  it("nextMenuEventSequence_incrementsPerMenu", () => {
    expect(nextMenuEventSequence("pub-7")).toBe(1);
    expect(nextMenuEventSequence("pub-7")).toBe(2);
    expect(nextMenuEventSequence("pub-8")).toBe(1);
  });

  it("detectMenuDeviceType_whenIphoneUa_thenMobile", () => {
    expect(detectMenuDeviceType()).toBe("MOBILE");
  });

  it("postMenuAnalyticsEvents_usesSendBeaconWhenAvailable", async () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (iPhone)",
      sendBeacon,
    });

    postMenuAnalyticsEvents(
      "pub-3",
      "sid",
      [{ type: "MENU_OPEN", sequence: 1, occurredAt: "2026-07-18T10:00:00" }],
      "MOBILE",
    );

    expect(sendBeacon).toHaveBeenCalledWith(
      "/api/analytics/menu/pub-3/events",
      expect.any(Blob),
    );
    const blob = sendBeacon.mock.calls[0][1] as Blob;
    const text = await blob.text();
    expect(JSON.parse(text)).toMatchObject({
      sessionId: "sid",
      deviceType: "MOBILE",
    });
  });
});
