import type { PlanPackageApiItem } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

export const TRIAL_INTENT = "trial";
export const TRIAL_PACKAGE_PARAM = "package";
export const DEFAULT_TRIAL_PACKAGE = "ultimate";
export const TRIAL_SESSION_KEY = "algory_trial_intent";

export function normalizeTrialPackageCode(code?: string | null): string {
  const normalized = (code ?? DEFAULT_TRIAL_PACKAGE).trim().toLowerCase();
  if (normalized === "ultimate" || normalized === "ultimate_package") {
    return "ULTIMATE_PACKAGE";
  }
  return normalized.toUpperCase();
}

export function buildTrialStartUrl(packageCode = DEFAULT_TRIAL_PACKAGE): string {
  const params = new URLSearchParams({
    [TRIAL_PACKAGE_PARAM]: packageCode.trim().toLowerCase(),
  });
  return `${DASHBOARD_ROUTES.trialStart}?${params.toString()}`;
}

export function buildRegisterTrialUrl(packageCode = DEFAULT_TRIAL_PACKAGE): string {
  const params = new URLSearchParams({
    intent: TRIAL_INTENT,
    [TRIAL_PACKAGE_PARAM]: packageCode.trim().toLowerCase(),
  });
  return `/register?${params.toString()}`;
}

export function buildLoginWithReturnUrl(returnPath: string): string {
  const params = new URLSearchParams({ returnUrl: returnPath });
  return `/login?${params.toString()}`;
}

export function buildLoginTrialReturnUrl(packageCode = DEFAULT_TRIAL_PACKAGE): string {
  return buildLoginWithReturnUrl(buildTrialStartUrl(packageCode));
}

export function resolveSafeReturnUrl(
  value: string | null | undefined,
  origin?: string,
): string | null {
  if (!value?.trim()) return null;
  try {
    const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "http://localhost");
    const parsed = new URL(value, base);
    const baseOrigin = new URL(base).origin;
    if (parsed.origin !== baseOrigin) return null;
    if (!parsed.pathname.startsWith("/")) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export function resolveTrialPackageId(
  packages: PlanPackageApiItem[],
  packageCode?: string | null,
): number | null {
  const normalized = normalizeTrialPackageCode(packageCode);
  const match = packages.find((pkg) => pkg.code === normalized);
  return match?.id ?? null;
}

export function isTrialRegisterIntent(intent: string | null | undefined): boolean {
  return intent?.trim().toLowerCase() === TRIAL_INTENT;
}

export function readTrialPackageFromSearch(
  params: URLSearchParams,
  fallback?: string | null,
): string {
  return params.get(TRIAL_PACKAGE_PARAM)?.trim().toLowerCase() || fallback || DEFAULT_TRIAL_PACKAGE;
}

export function persistTrialIntent(packageCode: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    TRIAL_SESSION_KEY,
    JSON.stringify({ package: packageCode.trim().toLowerCase() }),
  );
}

export function readPersistedTrialPackage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(TRIAL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { package?: string };
    return parsed.package?.trim().toLowerCase() || null;
  } catch {
    return null;
  }
}

export function clearPersistedTrialIntent(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TRIAL_SESSION_KEY);
}

export function buildGoogleAuthStartUrl(
  intent: "login" | "register",
  returnUrl?: string | null,
): string {
  const params = new URLSearchParams({ intent });
  const safeReturn = returnUrl ? resolveSafeReturnUrl(returnUrl) : null;
  if (safeReturn) params.set("returnUrl", safeReturn);
  return `/api/auth/google/start?${params.toString()}`;
}
