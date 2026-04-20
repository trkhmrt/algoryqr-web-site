import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAuthUpstreamUrl } from "@/lib/config";
import { clearAuthCookies, readRefreshTokenFromCookies } from "@/lib/server/auth-cookies";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = readRefreshTokenFromCookies(cookieStore);
    if (refreshToken) {
      await axios
        .post(`${getAuthUpstreamUrl()}/basicauth/logout`, { refreshToken }, {
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          validateStatus: () => true,
          timeout: 15_000,
        })
        .catch(() => undefined);
    }
  } catch {
    /* best-effort */
  }

  const response = NextResponse.json({ success: true }, { status: 200 });
  clearAuthCookies(response);
  return response;
}
