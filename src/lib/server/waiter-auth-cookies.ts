import { NextResponse } from "next/server";

import { COOKIE_MAX_AGE_SECONDS } from "@/lib/config";

const baseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

const cookieOptions = { ...baseOptions, maxAge: COOKIE_MAX_AGE_SECONDS };

type CookieStore = { get: (name: string) => { value?: string } | undefined };

export function readWaiterAccessTokenFromCookies(cookieStore: CookieStore): string | null {
  const t = cookieStore.get("waiter_access")?.value?.trim();
  return t || null;
}

export function readWaiterRefreshTokenFromCookies(cookieStore: CookieStore): string | null {
  const t = cookieStore.get("waiter_refresh")?.value?.trim();
  return t || null;
}

export function readWaiterIdFromCookies(cookieStore: CookieStore): number | null {
  const raw = cookieStore.get("waiter_id")?.value?.trim();
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function setWaiterAuthCookies(
  response: NextResponse,
  accessToken?: string,
  refreshToken?: string,
  waiterId?: number,
) {
  if (accessToken) {
    response.cookies.set("waiter_access", accessToken, cookieOptions);
  }
  if (refreshToken) {
    response.cookies.set("waiter_refresh", refreshToken, cookieOptions);
  }
  if (waiterId != null && waiterId > 0) {
    response.cookies.set("waiter_id", String(waiterId), cookieOptions);
  }
}

export function clearWaiterAuthCookies(response: NextResponse) {
  const clearOptions = { ...cookieOptions, maxAge: 0 };
  response.cookies.set("waiter_access", "", clearOptions);
  response.cookies.set("waiter_refresh", "", clearOptions);
  response.cookies.set("waiter_id", "", clearOptions);
}
