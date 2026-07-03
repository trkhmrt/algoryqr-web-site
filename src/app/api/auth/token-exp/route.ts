import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getExpFromAccessToken } from "@/lib/auth-user";
import { readAccessTokenFromCookies, readRefreshTokenFromCookies } from "@/lib/server/auth-cookies";

function readExpiryFromCookie(cookieStore: Awaited<ReturnType<typeof cookies>>, name: string): number | null {
  const raw = cookieStore.get(name)?.value?.trim();
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = readAccessTokenFromCookies(cookieStore);
  const refreshToken = readRefreshTokenFromCookies(cookieStore);

  const accessTokenExpiresAt =
    getExpFromAccessToken(accessToken ?? undefined) ??
    readExpiryFromCookie(cookieStore, "accessTokenExp") ??
    null;
  const refreshTokenExpiresAt =
    readExpiryFromCookie(cookieStore, "refreshTokenExp") ??
    getExpFromAccessToken(refreshToken ?? undefined) ??
    null;
  return NextResponse.json({ accessTokenExpiresAt, refreshTokenExpiresAt });
}
