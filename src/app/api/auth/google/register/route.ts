import { NextResponse } from "next/server";
import { AUTH_BASE, COOKIE_MAX_AGE_SECONDS } from "@/lib/config";
import { getExpFromAccessToken } from "@/lib/auth-user";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const token = body.startsWith("{") ? (JSON.parse(body) as { idToken?: string })?.idToken ?? "" : body;
    const upstream = await fetch(`${AUTH_BASE}/basicauth/google/login`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: token,
      cache: "no-store",
    });

    const raw = await upstream.text();
    let data: any = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { message: raw || "Beklenmeyen yanıt" };
    }
    if (!upstream.ok) {
      return NextResponse.json(
        { message: data?.message || "Google ile kayıt başarısız" },
        { status: upstream.status || 400 },
      );
    }

    const accessToken = data?.accessToken || data?.access_token;
    const refreshToken = data?.refreshToken || data?.refresh_token;
    const accessTokenExpiresAt = getExpFromAccessToken(accessToken) ?? undefined;
    const response = NextResponse.json(
      { ...data, accessTokenExpiresAt },
      { status: 200 },
    );

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
