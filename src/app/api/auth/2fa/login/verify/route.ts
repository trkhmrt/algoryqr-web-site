import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getExpFromAccessToken } from "@/lib/auth-user";
import { getAuthUpstreamUrl } from "@/lib/config";
import { setAuthCookies } from "@/lib/server/auth-cookies";

/** POST /authservice/2fa/login/verify — Bearer pending JWT + { code }. */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { code?: string };
    const code = String(body?.code ?? "").trim();
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ message: "6 haneli kod gerekli" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const pending = cookieStore.get("algory_2fa_pending")?.value;
    if (!pending) {
      return NextResponse.json(
        { message: "2FA oturumu bulunamadı; girişi yeniden deneyin." },
        { status: 401 },
      );
    }

    const upstream = await axios.post<Record<string, unknown>>(
      `${getAuthUpstreamUrl()}/2fa/login/verify`,
      { code },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${pending}`,
        },
        validateStatus: () => true,
        timeout: 20_000,
      },
    );

    const data = (typeof upstream.data === "object" && upstream.data != null ? upstream.data : {}) as Record<
      string,
      unknown
    > & { message?: string };

    if (upstream.status < 200 || upstream.status >= 300) {
      const message =
        typeof data.message === "string" ? data.message : "2FA doğrulaması başarısız";
      return NextResponse.json({ message }, { status: upstream.status || 401 });
    }

    const accessToken = (data.accessToken as string) || (data.access_token as string);
    const refreshToken = (data.refreshToken as string) || (data.refresh_token as string);
    const accessTokenExpiresAt = getExpFromAccessToken(accessToken) ?? undefined;

    const response = NextResponse.json({ ...data, accessTokenExpiresAt }, { status: 200 });

    const clearPending = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0,
    };
    response.cookies.set("algory_2fa_pending", "", clearPending);

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
