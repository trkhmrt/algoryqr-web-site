import { NextResponse } from "next/server";
import { AUTH_BASE, COOKIE_MAX_AGE_SECONDS } from "@/lib/config";
import { getExpFromAccessToken } from "@/lib/auth-user";

type RegisterBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterBody;
    const upstream = await fetch(`${AUTH_BASE}/basicauth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const raw = await upstream.text();
    let data: { message?: string; accessToken?: string; refreshToken?: string; access_token?: string; refresh_token?: string } = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { message: raw || "Beklenmeyen yanıt" };
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { message: data?.message || "Kayıt başarısız" },
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sunucu hatası";
    return NextResponse.json({ message: "Kayıt sırasında hata: " + message }, { status: 500 });
  }
}
