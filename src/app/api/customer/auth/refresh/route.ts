import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getUserIdFromAccessToken } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import {
  clearCustomerAuthCookies,
  readCustomerRefreshTokenFromCookies,
  setCustomerAuthCookies,
} from "@/lib/server/customer-auth-cookies";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = readCustomerRefreshTokenFromCookies(cookieStore);

    if (!refreshToken) {
      const res = NextResponse.json({ message: "Refresh token yok" }, { status: 401 });
      clearCustomerAuthCookies(res);
      return res;
    }

    const upstream = await axios.post<Record<string, unknown>>(
      `${API_BASE_URL}/customer/auth/refresh`,
      { refreshToken },
      {
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        validateStatus: () => true,
        timeout: 20_000,
      },
    );

    const data = (typeof upstream.data === "object" && upstream.data != null
      ? upstream.data
      : {}) as {
      message?: string;
      accessToken?: string;
      refreshToken?: string;
      customerId?: number;
    };

    if (upstream.status < 200 || upstream.status >= 300) {
      const status = upstream.status || 401;
      const response = NextResponse.json(
        { message: typeof data?.message === "string" ? data.message : "Token yenilenemedi" },
        { status },
      );
      if (status === 401) {
        clearCustomerAuthCookies(response);
      }
      return response;
    }

    const accessToken = data.accessToken;
    const newRefresh = data.refreshToken;
    const customerId =
      typeof data.customerId === "number"
        ? data.customerId
        : getUserIdFromAccessToken(typeof accessToken === "string" ? accessToken : undefined) ??
          undefined;

    const response = NextResponse.json({ ...data, customerId }, { status: 200 });
    setCustomerAuthCookies(
      response,
      typeof accessToken === "string" ? accessToken : undefined,
      typeof newRefresh === "string" ? newRefresh : undefined,
      customerId,
    );
    return response;
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
