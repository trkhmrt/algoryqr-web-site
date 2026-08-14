import { NextResponse } from "next/server";

import { getExpFromAccessToken } from "@/lib/auth-user";
import { setAuthCookies, setTokenExpiryCookies } from "@/lib/server/auth-cookies";
import { fetchCurrentSessionRefreshExpiresAt } from "@/lib/server/session-expiry";

type ImpersonateBody = {
  accessToken?: string;
  refreshToken?: string;
  userId?: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ImpersonateBody;
    const accessToken = typeof body.accessToken === "string" ? body.accessToken.trim() : "";
    const refreshToken = typeof body.refreshToken === "string" ? body.refreshToken.trim() : "";
    const userId = typeof body.userId === "number" ? body.userId : undefined;

    if (!accessToken || !refreshToken || !userId) {
      return NextResponse.json({ message: "Geçersiz oturum bilgisi" }, { status: 400 });
    }

    const accessTokenExpiresAt = getExpFromAccessToken(accessToken) ?? undefined;
    const refreshTokenExpiresAt = await fetchCurrentSessionRefreshExpiresAt(accessToken);

    const response = NextResponse.json({ ok: true, userId }, { status: 200 });
    setAuthCookies(response, accessToken, refreshToken, userId);
    setTokenExpiryCookies(response, accessTokenExpiresAt, refreshTokenExpiresAt ?? undefined);
    return response;
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
