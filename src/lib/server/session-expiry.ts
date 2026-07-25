import axios from "axios";

import { getUserIdFromAccessToken, isoToEpochSeconds } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";

type SessionRow = {
  current?: boolean;
  refreshExpiresAt?: string | null;
};

export async function fetchCurrentSessionRefreshExpiresAt(
  accessToken: string,
): Promise<number | undefined> {
  try {
    const userId = getUserIdFromAccessToken(accessToken);
    const upstream = await axios.get<SessionRow[]>(`${API_BASE_URL}/auth/sessions`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        ...(userId != null ? { "X-User-Id": String(userId) } : {}),
      },
      validateStatus: () => true,
      timeout: 10_000,
    });
    if (upstream.status < 200 || upstream.status >= 300 || !Array.isArray(upstream.data)) {
      return undefined;
    }
    const current =
      upstream.data.find((session) => session.current === true) ?? upstream.data[0];
    const exp = isoToEpochSeconds(current?.refreshExpiresAt ?? null);
    return exp ?? undefined;
  } catch {
    return undefined;
  }
}
