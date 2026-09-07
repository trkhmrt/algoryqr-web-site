export type BusinessType = "restaurant" | "cafe" | "hotel" | "other";

const WELCOME_DONE_PREFIX = "algory_welcome_done_";
const WELCOME_BUSINESS_PREFIX = "algory_welcome_business_";

export const BUSINESS_TYPE_OPTIONS: ReadonlyArray<{ id: BusinessType; label: string; hint: string }> = [
  { id: "restaurant", label: "Restoran", hint: "Masalı servis ve menü odaklı" },
  { id: "cafe", label: "Kafe", hint: "Hızlı sipariş ve günlük menü" },
  { id: "hotel", label: "Otel", hint: "Çoklu alan ve konuk menüsü" },
  { id: "other", label: "Diğer", hint: "Başka bir işletme tipi" },
];

export function welcomeDoneKey(userId: string | number): string {
  return `${WELCOME_DONE_PREFIX}${userId}`;
}

export function welcomeBusinessKey(userId: string | number): string {
  return `${WELCOME_BUSINESS_PREFIX}${userId}`;
}

export function isWelcomeOnboardingDone(userId: string | number | null | undefined): boolean {
  if (userId == null || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(welcomeDoneKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function markWelcomeOnboardingDone(
  userId: string | number,
  businessType?: BusinessType | null,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(welcomeDoneKey(userId), "1");
    if (businessType) {
      window.localStorage.setItem(welcomeBusinessKey(userId), businessType);
    }
  } catch {
    /* ignore */
  }
}

export function readWelcomeBusinessType(userId: string | number): BusinessType | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(welcomeBusinessKey(userId));
    if (value === "restaurant" || value === "cafe" || value === "hotel" || value === "other") {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}
