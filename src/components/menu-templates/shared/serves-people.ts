import type { MenuLocaleCode } from "./menu-locale";

export function formatServesPeopleLabel(
  min?: number | null,
  max?: number | null,
  locale: MenuLocaleCode = "tr",
): string | null {
  if (min == null || max == null || min < 1 || max < min) {
    return null;
  }
  const suffix =
    locale === "en" ? (min === max ? "serving" : "servings") :
    locale === "ru" ? "порц." :
    locale === "ar" ? "حصص" :
    "kişilik";
  if (min === max) {
    return `${min} ${suffix}`;
  }
  return `${min}–${max} ${suffix}`;
}

export function productMatchesServesPeople(
  product: { servesPeopleMin?: number | null; servesPeopleMax?: number | null },
  servesPeople: number | null | undefined,
): boolean {
  if (servesPeople == null || servesPeople < 1) {
    return true;
  }
  const min = product.servesPeopleMin;
  const max = product.servesPeopleMax;
  if (min == null || max == null) {
    return false;
  }
  return min <= servesPeople && max >= servesPeople;
}

const PARTY_KEY_PREFIX = "algory_menu_party_";

export function getStoredPartySize(menuId: number): number | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.sessionStorage.getItem(`${PARTY_KEY_PREFIX}${menuId}`);
  if (!raw) {
    return null;
  }
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value >= 1 ? value : null;
}

export function setStoredPartySize(menuId: number, value: number | null): void {
  if (typeof window === "undefined") {
    return;
  }
  const key = `${PARTY_KEY_PREFIX}${menuId}`;
  if (value == null || value < 1) {
    window.sessionStorage.removeItem(key);
    return;
  }
  window.sessionStorage.setItem(key, String(value));
}
