import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  const clearCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  response.cookies.set("algory_access_token", "", clearCookieOptions);
  response.cookies.set("algory_refresh_token", "", clearCookieOptions);
  response.cookies.set("accessToken", "", clearCookieOptions);
  response.cookies.set("refreshToken", "", clearCookieOptions);

  return response;
}
