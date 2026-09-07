import axios from "axios";

import { API_BASE_URL } from "@/lib/config";
import {
  destinationForDecision,
  parseAccessSession,
} from "@/lib/access-session-gate";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

export async function resolvePostAuthDashboardPathWithAccessToken(
  accessToken: string,
  returnPath: string | null | undefined,
): Promise<string> {
  try {
    const response = await axios.get(`${API_BASE_URL}/access/session`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 10_000,
      validateStatus: () => true,
    });
    if (response.status < 200 || response.status >= 300) {
      return returnPath ?? DASHBOARD_ROUTES.root;
    }
    const session = parseAccessSession(response.data);
    if (!session) {
      return returnPath ?? DASHBOARD_ROUTES.root;
    }
    return destinationForDecision(session.decision, returnPath);
  } catch {
    return returnPath ?? DASHBOARD_ROUTES.root;
  }
}
