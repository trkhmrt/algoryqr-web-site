import { mapTrialStatus, type DigitalMenuTrialStatus } from "@/lib/commerce";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { isActivePaidPurchase, pickActivePurchase, type ProductAccessPurchase } from "@/lib/product-access";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";

const TRIAL_EXPIRED_ALLOWLIST_PREFIXES = [
  DASHBOARD_ROUTES.trialExpired,
  DASHBOARD_ROUTES.accountPackages,
  "/dashboard/hesabim/abonelik",
  DASHBOARD_ROUTES.accountPaymentMethods,
  DASHBOARD_ROUTES.accountBillingAddresses,
  DASHBOARD_ROUTES.accountPaymentHistory,
] as const;

export function isTrialExpiredAllowlistedPath(pathname: string): boolean {
  return TRIAL_EXPIRED_ALLOWLIST_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function shouldForceTrialExpiredGate(
  trialStatus: string | null | undefined,
  hasActivePaid: boolean,
): boolean {
  return trialStatus === "TRIAL_EXPIRED" && !hasActivePaid;
}

export function resolveDashboardPathForTrial(
  returnPath: string | null | undefined,
  trialStatus: string | null | undefined,
  hasActivePaid: boolean,
): string {
  const pathname = returnPath?.split("?")[0] ?? "";
  if (returnPath && isTrialExpiredAllowlistedPath(pathname)) {
    return returnPath;
  }
  if (shouldForceTrialExpiredGate(trialStatus, hasActivePaid)) {
    return DASHBOARD_ROUTES.trialExpired;
  }
  return returnPath ?? DASHBOARD_ROUTES.root;
}

function purchasesFromPayload(payload: unknown): ProductAccessPurchase[] {
  if (Array.isArray(payload)) {
    return payload as ProductAccessPurchase[];
  }
  if (payload && typeof payload === "object") {
    const content = (payload as { content?: unknown }).content;
    if (Array.isArray(content)) {
      return content as ProductAccessPurchase[];
    }
  }
  return [];
}

function hasActivePaidFromPurchases(payload: unknown): boolean {
  return isActivePaidPurchase(pickActivePurchase(purchasesFromPayload(payload)));
}

export async function fetchTrialStatusClient(): Promise<DigitalMenuTrialStatus | null> {
  try {
    const response = await getSiteSameOriginAxios().get("/trials/status");
    return mapTrialStatus(response.data);
  } catch {
    return null;
  }
}

async function fetchHasActivePaidClient(): Promise<boolean> {
  try {
    const response = await getSiteSameOriginAxios().get("/purchases/my");
    return hasActivePaidFromPurchases(response.data);
  } catch {
    return false;
  }
}

export async function resolvePostAuthDashboardPath(
  returnPath: string | null | undefined,
): Promise<string> {
  const trial = await fetchTrialStatusClient();
  const hasActivePaid = await fetchHasActivePaidClient();
  return resolveDashboardPathForTrial(returnPath, trial?.status, hasActivePaid);
}
