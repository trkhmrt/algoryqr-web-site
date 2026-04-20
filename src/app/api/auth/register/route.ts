import axios from "axios";
import { NextResponse } from "next/server";

import { getExpFromAccessToken } from "@/lib/auth-user";
import { getAuthUpstreamUrl } from "@/lib/config";
import { messageFromRegisterUpstream } from "@/lib/register-upstream-error";
import { setAuthCookies } from "@/lib/server/auth-cookies";

type RegisterBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  registrationRole?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterBody;
    const upstream = await axios.post<Record<string, unknown>>(
      `${getAuthUpstreamUrl()}/basicauth/register`,
      body,
      {
        headers: { "Content-Type": "application/json", Accept: "application/json" },
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
    };

    if (upstream.status < 200 || upstream.status >= 300) {
      const rawStr =
        typeof raw === "string" ? raw : JSON.stringify(raw ?? {});
      const message = messageFromRegisterUpstream(rawStr, upstream.status);
      return NextResponse.json({ message }, { status: upstream.status || 400 });
    }

    const accessToken = data?.accessToken ?? data?.access_token;
    const refreshToken = data?.refreshToken ?? data?.refresh_token;
    const accessTokenExpiresAt = getExpFromAccessToken(typeof accessToken === "string" ? accessToken : undefined);
    const response = NextResponse.json({ ...data, accessTokenExpiresAt }, { status: 200 });

    setAuthCookies(
      response,
      typeof accessToken === "string" ? accessToken : undefined,
      typeof refreshToken === "string" ? refreshToken : undefined,
    );

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sunucu hatası";
    return NextResponse.json({ message: "Kayıt sırasında hata: " + message }, { status: 500 });
  }
}
