import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getExpFromAccessToken } from "@/lib/auth-user";
import { readAccessTokenFromCookies, readRefreshTokenFromCookies } from "@/lib/server/auth-cookies";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = readAccessTokenFromCookies(cookieStore);
  const refreshToken = readRefreshTokenFromCookies(cookieStore);

  const accessTokenExpiresAt = getExpFromAccessToken(accessToken ?? undefined) ?? null;
  const refreshTokenExpiresAt = getExpFromAccessToken(refreshToken ?? undefined) ?? null;
  return NextResponse.json({ accessTokenExpiresAt, refreshTokenExpiresAt });
}
