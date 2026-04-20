import axios from "axios";
import { NextResponse } from "next/server";

import { getExpFromAccessToken } from "@/lib/auth-user";
import { getAuthUpstreamUrl } from "@/lib/config";
import { messageFromRegisterUpstream } from "@/lib/register-upstream-error";
import { setAuthCookies } from "@/lib/server/auth-cookies";

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    let idToken = "";
    let registrationRole: string | undefined;
    if (bodyText.trim().startsWith("{")) {
      const o = JSON.parse(bodyText) as { idToken?: string; registrationRole?: string };
      idToken = o.idToken ?? "";
      registrationRole = o.registrationRole;
    } else {
      idToken = bodyText;
    }

    const upstream = await axios.post<Record<string, unknown>>(
      `${getAuthUpstreamUrl()}/google-auth/register`,
      {
        idToken,
        registrationRole: registrationRole ?? "QR_USER",
      },
      {
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        validateStatus: () => true,
        timeout: 20_000,
      },
    );

    const raw = upstream.data;
    const data = (typeof raw === "object" && raw != null ? raw : {}) as Record<string, unknown> & {
      message?: string;
      accessToken?: string;
      refreshToken?: string;
      access_token?: string;
      refresh_token?: string;
    };

    if (upstream.status < 200 || upstream.status >= 300) {
      const rawStr = typeof raw === "string" ? raw : JSON.stringify(raw ?? {});
      const message = messageFromRegisterUpstream(rawStr, upstream.status);
      return NextResponse.json({ message }, { status: upstream.status || 400 });
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
