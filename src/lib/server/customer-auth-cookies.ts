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

export function readCustomerAccessTokenFromCookies(cookieStore: CookieStore): string | null {
  const t = cookieStore.get("customer_access")?.value?.trim();
  return t || null;
}

export function readCustomerRefreshTokenFromCookies(cookieStore: CookieStore): string | null {
  const t = cookieStore.get("customer_refresh")?.value?.trim();
  return t || null;
}

export function readCustomerIdFromCookies(cookieStore: CookieStore): number | null {
  const raw = cookieStore.get("customer_id")?.value?.trim();
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function setCustomerAuthCookies(
  response: NextResponse,
  accessToken?: string,
  refreshToken?: string,
  customerId?: number,
) {
  if (accessToken) {
    response.cookies.set("customer_access", accessToken, cookieOptions);
  }
  if (refreshToken) {
    response.cookies.set("customer_refresh", refreshToken, cookieOptions);
  }
  if (customerId != null && customerId > 0) {
    response.cookies.set("customer_id", String(customerId), cookieOptions);
  }
}

export function clearCustomerAuthCookies(response: NextResponse) {
  const clearOptions = { ...cookieOptions, maxAge: 0 };
  response.cookies.set("customer_access", "", clearOptions);
  response.cookies.set("customer_refresh", "", clearOptions);
  response.cookies.set("customer_id", "", clearOptions);
}

export const CUSTOMER_OAUTH_RETURN_COOKIE = "customer_oauth_return";

export function setCustomerOAuthReturnCookie(response: NextResponse, returnUrl: string) {
  response.cookies.set(CUSTOMER_OAUTH_RETURN_COOKIE, returnUrl, {
    ...baseOptions,
    maxAge: 600,
  });
}

export function clearCustomerOAuthReturnCookie(response: NextResponse) {
  response.cookies.set(CUSTOMER_OAUTH_RETURN_COOKIE, "", {
    ...baseOptions,
    maxAge: 0,
  });
}
