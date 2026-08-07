export type MenuAnalyticsEventType =
  | "MENU_OPEN"
  | "CATEGORY_VIEW"
  | "PRODUCT_VIEW"
  | "SERVES_FILTER";
export type MenuAnalyticsDeviceType = "MOBILE" | "TABLET" | "DESKTOP";

export type MenuAnalyticsEventItem = {
  type: MenuAnalyticsEventType;
  categoryId?: number;
  productId?: number;
  servesPeople?: number;
  sequence: number;
  occurredAt: string;
};

const SESSION_KEY_PREFIX = "algory_menu_sid_";
const SEQUENCE_KEY_PREFIX = "algory_menu_seq_";

export function detectMenuDeviceType(): MenuAnalyticsDeviceType {
  if (typeof navigator === "undefined") {
    return "DESKTOP";
  }
  const ua = (navigator.userAgent || "").toLowerCase();
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
  if (ua.includes("tablet") || ua.includes("ipad") || (ua.includes("android") && !ua.includes("mobile"))) {
    return "TABLET";
  }
  if (
    uaData?.mobile === true ||
    ua.includes("mobile") ||
    ua.includes("iphone") ||
    ua.includes("ipod") ||
    ua.includes("android")
  ) {
    return "MOBILE";
  }
  if (typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse) and (max-width: 1024px)").matches) {
    return "MOBILE";
  }
  return "DESKTOP";
}

function randomUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function getOrCreateMenuSessionId(menuId: number): string {
  if (typeof window === "undefined") {
    return randomUuid();
  }
  const key = `${SESSION_KEY_PREFIX}${menuId}`;
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const created = randomUuid();
  window.localStorage.setItem(key, created);
  return created;
}

export function nextMenuEventSequence(menuId: number): number {
  if (typeof window === "undefined") {
    return 1;
  }
  const key = `${SEQUENCE_KEY_PREFIX}${menuId}`;
  const current = Number.parseInt(window.localStorage.getItem(key) ?? "0", 10);
  const next = Number.isFinite(current) ? current + 1 : 1;
  window.localStorage.setItem(key, String(next));
  return next;
}

export function postMenuAnalyticsEvents(
  menuId: number,
  sessionId: string,
  events: MenuAnalyticsEventItem[],
  deviceType: MenuAnalyticsDeviceType = detectMenuDeviceType(),
): void {
  if (events.length === 0 || typeof window === "undefined") {
    return;
  }
  const payload = JSON.stringify({ sessionId, deviceType, events });
  const url = `/api/analytics/menu/${menuId}/events`;
  const clientUserAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon(url, blob)) {
        return;
      }
    }
  } catch {
  }
  void fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(clientUserAgent ? { "X-Client-User-Agent": clientUserAgent } : {}),
    },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}
