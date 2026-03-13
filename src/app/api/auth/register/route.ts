import { NextResponse } from "next/server";
import { AUTH_BASE } from "@/lib/config";

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

    const data = await upstream.json();
    if (!upstream.ok) {
      return NextResponse.json(
        { message: data?.message || "Kayıt başarısız" },
        { status: upstream.status || 400 },
      );
    }

    const accessToken = data?.accessToken || data?.access_token;
    const refreshToken = data?.refreshToken || data?.refresh_token;
    const response = NextResponse.json(data, { status: 200 });

    if (accessToken) {
      const accessCookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
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
        maxAge: 60 * 60 * 24 * 30,
      };
      response.cookies.set("algory_refresh_token", refreshToken, refreshCookieOptions);
      response.cookies.set("refreshToken", refreshToken, refreshCookieOptions);
    }

    return response;
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
