import axios from "axios";

import { getExpFromAccessToken } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";

export type RefreshedTokens = {
  accessToken: string;
  refreshToken?: string;
};

export async function refreshAccessToken(refreshToken: string): Promise<RefreshedTokens | null> {
  const upstream = await axios.post<Record<string, unknown>>(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken },
    {
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      validateStatus: () => true,
      timeout: 20_000,
    },
  );

  if (upstream.status < 200 || upstream.status >= 300) return null;

  const data = upstream.data ?? {};
  const accessToken =
    (typeof data.accessToken === "string" && data.accessToken) ||
    (typeof data.access_token === "string" && data.access_token) ||
    null;
  if (!accessToken) return null;

  const newRefresh =
    (typeof data.refreshToken === "string" && data.refreshToken) ||
    (typeof data.refresh_token === "string" && data.refresh_token) ||
    undefined;

  return { accessToken, refreshToken: newRefresh };
}

export async function resolveAccessTokenForGrant(
  accessToken: string,
  refreshToken: string | null,
): Promise<RefreshedTokens> {
  const expMs = getExpFromAccessToken(accessToken);
  if (expMs != null && expMs > Date.now() + 15_000) {
    return { accessToken };
  }
  if (refreshToken) {
    const refreshed = await refreshAccessToken(refreshToken);
    if (refreshed) return refreshed;
  }
  return { accessToken };
}
