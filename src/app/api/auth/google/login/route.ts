import axios from "axios";
import { NextResponse } from "next/server";

import { getExpFromAccessToken } from "@/lib/auth-user";
import { getAuthUpstreamUrl } from "@/lib/config";
import { setAuthCookies, setTwoFactorPendingCookie } from "@/lib/server/auth-cookies";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const token = body.startsWith("{") ? (JSON.parse(body) as { idToken?: string })?.idToken ?? "" : body;

    const upstream = await axios.post<Record<string, unknown>>(
      `${getAuthUpstreamUrl()}/google-auth/login`,
      token,
      {
        headers: { "Content-Type": "text/plain", Accept: "application/json" },
        transformRequest: [(d) => (typeof d === "string" ? d : String(d))],
        validateStatus: () => true,
        timeout: 20_000,
      },
    );

    const data = (typeof upstream.data === "object" && upstream.data != null ? upstream.data : {}) as Record<
      string,
      unknown
    > & {
      message?: string;
      requiresTwoFactor?: boolean;
      twoFactorToken?: string;
      userId?: number;
      email?: string;
      firstName?: string;
      lastName?: string;
      accessToken?: string;
      access_token?: string;
      refreshToken?: string;
      refresh_token?: string;
    };

    if (upstream.status < 200 || upstream.status >= 300) {
      return NextResponse.json(
        { message: typeof data?.message === "string" ? data.message : "Google ile giriş başarısız" },
        { status: upstream.status || 401 },
      );
    }

    if (data?.requiresTwoFactor === true && data?.twoFactorToken) {
      const response = NextResponse.json(
        {
          requiresTwoFactor: true,
          userId: data.userId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
        },
        { status: 200 },
      );
      setTwoFactorPendingCookie(response, String(data.twoFactorToken));
      return response;
    }

    const accessToken = data?.accessToken ?? data?.access_token;
    const refreshToken = data?.refreshToken ?? data?.refresh_token;
    const accessTokenExpiresAt =
      getExpFromAccessToken(typeof accessToken === "string" ? accessToken : undefined) ?? undefined;
    const response = NextResponse.json({ ...data, accessTokenExpiresAt }, { status: 200 });

    setAuthCookies(
      response,
      typeof accessToken === "string" ? accessToken : undefined,
      typeof refreshToken === "string" ? refreshToken : undefined,
    );

    return response;
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
