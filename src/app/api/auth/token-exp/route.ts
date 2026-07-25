import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getExpFromAccessToken } from "@/lib/auth-user";
import {
  readAccessTokenFromCookies,
  setRefreshTokenExpiryCookie,
  setTokenExpiryCookies,
} from "@/lib/server/auth-cookies";
import { fetchCurrentSessionRefreshExpiresAt } from "@/lib/server/session-expiry";

function readExpiryFromCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  name: string,
): number | null {
  const raw = cookieStore.get(name)?.value?.trim();
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = readAccessTokenFromCookies(cookieStore);

  const accessTokenExpiresAt =
    getExpFromAccessToken(accessToken ?? undefined) ??
    readExpiryFromCookie(cookieStore, "accessTokenExp") ??
    null;

  let refreshTokenExpiresAt = readExpiryFromCookie(cookieStore, "refreshTokenExp");
  let shouldPersistRefreshExp = false;

  if (refreshTokenExpiresAt == null && accessToken) {
    const fromSession = await fetchCurrentSessionRefreshExpiresAt(accessToken);
    if (fromSession != null) {
      refreshTokenExpiresAt = fromSession;
      shouldPersistRefreshExp = true;
    }
  }

  const response = NextResponse.json({
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  });

  if (shouldPersistRefreshExp && refreshTokenExpiresAt != null) {
    if (accessTokenExpiresAt != null) {
      setTokenExpiryCookies(response, accessTokenExpiresAt, refreshTokenExpiresAt);
    } else {
      setRefreshTokenExpiryCookie(response, refreshTokenExpiresAt);
    }
  }

  return response;
}
