import axios from "axios";

import { mapTrialStatus } from "@/lib/commerce";
import { API_BASE_URL } from "@/lib/config";
import { isActivePaidPurchase, pickActivePurchase, type ProductAccessPurchase } from "@/lib/product-access";
import {
  isTrialExpiredAllowlistedPath,
  resolveDashboardPathForTrial,
} from "@/lib/trial-expired-gate";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

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

export async function resolvePostAuthDashboardPathWithAccessToken(
  accessToken: string,
  returnPath: string | null | undefined,
): Promise<string> {
  const pathname = returnPath?.split("?")[0] ?? "";
  if (returnPath && isTrialExpiredAllowlistedPath(pathname)) {
    return returnPath;
  }

  try {
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const [trialResponse, purchasesResponse] = await Promise.all([
      axios.get(`${API_BASE_URL}/trials/status`, {
        headers,
        timeout: 10_000,
        validateStatus: () => true,
      }),
      axios.get(`${API_BASE_URL}/purchases/my`, {
        headers,
        timeout: 10_000,
        validateStatus: () => true,
      }),
    ]);

    const trial =
      trialResponse.status >= 200 && trialResponse.status < 300
        ? mapTrialStatus(trialResponse.data ?? {})
        : null;
    const hasActivePaid =
      purchasesResponse.status >= 200 && purchasesResponse.status < 300
        ? hasActivePaidFromPurchases(purchasesResponse.data)
        : false;

    return resolveDashboardPathForTrial(returnPath, trial?.status, hasActivePaid);
  } catch {
    return returnPath ?? DASHBOARD_ROUTES.root;
  }
}
