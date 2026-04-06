import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_MAX_AGE_SECONDS, getAuthUpstreamUrl } from "@/lib/config";
import { getExpFromAccessToken } from "@/lib/auth-user";

/** Gateway: POST /authservice/2fa/login/verify — Cookie algory_2fa_pending Bearer + { code }. */
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

    const upstream = await fetch(`${getAuthUpstreamUrl()}/2fa/login/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pending}`,
      },
      body: JSON.stringify({ code }),
      cache: "no-store",
    });

    const text = await upstream.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      return NextResponse.json({ message: text || "Geçersiz yanıt" }, { status: 502 });
    }

    if (!upstream.ok) {
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

    if (accessToken) {
      const accessCookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: COOKIE_MAX_AGE_SECONDS,
      };
      response.cookies.set("algory_access_token", accessToken, accessCookieOptions);
      response.cookies.set("accessToken", accessToken, accessCookieOptions);
    }

    if (refreshToken) {
      const refreshCookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: COOKIE_MAX_AGE_SECONDS,
      };
      response.cookies.set("algory_refresh_token", refreshToken, refreshCookieOptions);
      response.cookies.set("refreshToken", refreshToken, refreshCookieOptions);
    }

    return response;
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
