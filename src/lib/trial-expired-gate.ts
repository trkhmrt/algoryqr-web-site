import { mapTrialStatus, type DigitalMenuTrialStatus } from "@/lib/commerce";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
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

export async function fetchTrialStatusClient(): Promise<DigitalMenuTrialStatus | null> {
  try {
    const response = await getSiteSameOriginAxios().get("/trials/status");
    return mapTrialStatus(response.data);
  } catch {
    return null;
  }
}

export async function resolvePostAuthDashboardPath(
  returnPath: string | null | undefined,
): Promise<string> {
  const pathname = returnPath?.split("?")[0] ?? "";
  if (returnPath && isTrialExpiredAllowlistedPath(pathname)) {
    return returnPath;
  }

  const trial = await fetchTrialStatusClient();
  if (trial?.status === "TRIAL_EXPIRED") {
    return DASHBOARD_ROUTES.trialExpired;
  }
  return returnPath ?? DASHBOARD_ROUTES.root;
}
