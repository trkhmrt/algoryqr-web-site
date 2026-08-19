import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getExpFromAccessToken } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import {
  clearWaiterAuthCookies,
  readWaiterRefreshTokenFromCookies,
  setWaiterAuthCookies,
} from "@/lib/server/waiter-auth-cookies";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = readWaiterRefreshTokenFromCookies(cookieStore);

    if (!refreshToken) {
      const res = NextResponse.json({ message: "Refresh token yok" }, { status: 401 });
      clearWaiterAuthCookies(res);
      return res;
    }

    const upstream = await axios.post<Record<string, unknown>>(
      `${API_BASE_URL}/waiter/auth/refresh`,
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
      waiterId?: number;
    };

    if (upstream.status < 200 || upstream.status >= 300) {
      const status = upstream.status || 401;
      const response = NextResponse.json(
        { message: typeof data?.message === "string" ? data.message : "Token yenilenemedi" },
        { status },
      );
      if (status === 401) {
        clearWaiterAuthCookies(response);
      }
      return response;
    }

    const accessToken = data.accessToken;
    const newRefresh = data.refreshToken;
    const accessTokenExpiresAt = getExpFromAccessToken(
      typeof accessToken === "string" ? accessToken : undefined,
    );

    const response = NextResponse.json(
      { ...data, accessTokenExpiresAt },
      { status: 200 },
    );

    setWaiterAuthCookies(
      response,
      typeof accessToken === "string" ? accessToken : undefined,
      typeof newRefresh === "string" ? newRefresh : undefined,
      typeof data.waiterId === "number" ? data.waiterId : undefined,
    );

    return response;
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
