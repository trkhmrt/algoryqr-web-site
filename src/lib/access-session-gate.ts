import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";

export type AccessDecision =
  | "START_PACKAGE"
  | "REQUIRE_PURCHASE"
  | "REQUIRE_PAYMENT"
  | "ALLOW";

export type AccessSession = {
  decision: AccessDecision;
  packageCode?: string | null;
  endsAt?: string | null;
  debtDueAt?: string | null;
  messageKey?: string | null;
  code?: string | null;
};

const PURCHASE_ALLOWLIST_PREFIXES = [
  DASHBOARD_ROUTES.accountPackages,
  "/dashboard/hesabim/abonelik",
  DASHBOARD_ROUTES.accountPaymentMethods,
  DASHBOARD_ROUTES.accountBillingAddresses,
  DASHBOARD_ROUTES.accountPaymentHistory,
] as const;

const START_ALLOWLIST_PREFIXES = [
  DASHBOARD_ROUTES.trialStart,
  DASHBOARD_ROUTES.welcomeOnboarding,
] as const;

export function isPurchaseAllowlistedPath(pathname: string): boolean {
  return PURCHASE_ALLOWLIST_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isStartAllowlistedPath(pathname: string): boolean {
  return START_ALLOWLIST_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function destinationForDecision(
  decision: AccessDecision,
  returnPath: string | null | undefined,
): string {
  const pathname = returnPath?.split("?")[0] ?? "";
  if (decision === "ALLOW") {
    return returnPath ?? DASHBOARD_ROUTES.root;
  }
  if (decision === "START_PACKAGE") {
    if (returnPath && isStartAllowlistedPath(pathname)) {
      return returnPath;
    }
    return DASHBOARD_ROUTES.trialStart;
  }
  if (returnPath && isPurchaseAllowlistedPath(pathname)) {
    return returnPath;
  }
  return DASHBOARD_ROUTES.accountPackages;
}

export function parseAccessSession(payload: unknown): AccessSession | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const decision = record.decision;
  if (
    decision !== "START_PACKAGE"
    && decision !== "REQUIRE_PURCHASE"
    && decision !== "REQUIRE_PAYMENT"
    && decision !== "ALLOW"
  ) {
    return null;
  }
  return {
    decision,
    packageCode: typeof record.packageCode === "string" ? record.packageCode : null,
    endsAt: typeof record.endsAt === "string" ? record.endsAt : null,
    debtDueAt: typeof record.debtDueAt === "string" ? record.debtDueAt : null,
    messageKey: typeof record.messageKey === "string" ? record.messageKey : null,
    code: typeof record.code === "string" ? record.code : null,
  };
}

export async function fetchAccessSessionClient(): Promise<AccessSession | null> {
  try {
    const response = await getSiteSameOriginAxios().get("/access/session");
    return parseAccessSession(response.data);
  } catch {
    return null;
  }
}

export async function resolvePostAuthDashboardPath(
  returnPath: string | null | undefined,
): Promise<string> {
  const session = await fetchAccessSessionClient();
  if (!session) {
    return returnPath ?? DASHBOARD_ROUTES.root;
  }
  return destinationForDecision(session.decision, returnPath);
}
