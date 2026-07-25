import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getExpFromAccessToken } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import {
  clearAuthCookies,
  readRefreshTokenFromCookies,
  setAuthCookies,
  setTokenExpiryCookies,
} from "@/lib/server/auth-cookies";
import { fetchCurrentSessionRefreshExpiresAt } from "@/lib/server/session-expiry";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const refreshToken = readRefreshTokenFromCookies(cookieStore);

    if (!refreshToken) {
      const res = NextResponse.json({ message: "Refresh token yok" }, { status: 401 });
      clearAuthCookies(res);
      return res;
    }

    const upstream = await axios.post<Record<string, unknown>>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      {
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        validateStatus: () => true,
        timeout: 20_000,
      },
    );

    const raw = upstream.data;
    const data = (typeof raw === "object" && raw != null ? raw : {}) as {
      message?: string;
      accessToken?: string;
      refreshToken?: string;
      access_token?: string;
      refresh_token?: string;
      userId?: number;
    };

    if (upstream.status < 200 || upstream.status >= 300) {
      const status = upstream.status || 401;
      const response = NextResponse.json(
        { message: typeof data?.message === "string" ? data.message : "Token yenilenemedi" },
        { status },
      );
      if (status === 401) {
        clearAuthCookies(response);
      }
      return response;
    }

    const accessToken = data?.accessToken ?? data?.access_token;
    const newRefresh = data?.refreshToken ?? data?.refresh_token;
    const accessTokenExpiresAt = getExpFromAccessToken(
      typeof accessToken === "string" ? accessToken : undefined,
    );
    const refreshTokenExpiresAt =
      typeof accessToken === "string"
        ? await fetchCurrentSessionRefreshExpiresAt(accessToken)
        : undefined;

    const response = NextResponse.json(
      { ...data, accessTokenExpiresAt, refreshTokenExpiresAt },
      { status: 200 },
    );

    setAuthCookies(
      response,
      typeof accessToken === "string" ? accessToken : undefined,
      typeof newRefresh === "string" ? newRefresh : undefined,
      typeof data.userId === "number" ? data.userId : undefined,
    );
    setTokenExpiryCookies(
      response,
      accessTokenExpiresAt ?? undefined,
      refreshTokenExpiresAt,
    );

    return response;
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
