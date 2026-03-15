import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getExpFromAccessToken } from "@/lib/auth-user";

/** Access ve refresh token cookie'lerinden exp (epoch saniye) döner. Client sayacı için. */
export async function GET() {
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get("algory_access_token")?.value ||
    cookieStore.get("accessToken")?.value;
  const refreshToken =
    cookieStore.get("algory_refresh_token")?.value ||
    cookieStore.get("refreshToken")?.value;

  const accessTokenExpiresAt = getExpFromAccessToken(accessToken) ?? null;
  const refreshTokenExpiresAt = getExpFromAccessToken(refreshToken) ?? null;
  return NextResponse.json({ accessTokenExpiresAt, refreshTokenExpiresAt });
}
