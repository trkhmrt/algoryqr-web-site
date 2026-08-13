import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_BASE_URL } from "@/lib/config";
import {
  clearCustomerAuthCookies,
  readCustomerAccessTokenFromCookies,
  readCustomerRefreshTokenFromCookies,
} from "@/lib/server/customer-auth-cookies";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = readCustomerRefreshTokenFromCookies(cookieStore);
    const accessToken = readCustomerAccessTokenFromCookies(cookieStore);
    if (refreshToken || accessToken) {
      await axios
        .post(
          `${API_BASE_URL}/customer/auth/logout`,
          { refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            validateStatus: () => true,
            timeout: 15_000,
          },
        )
        .catch(() => undefined);
    }
  } catch {
    /* best-effort */
  }

  const response = NextResponse.json({ success: true }, { status: 200 });
  clearCustomerAuthCookies(response);
  return response;
}
