import { NextRequest, NextResponse } from "next/server";

import { getAppOrigin } from "@/lib/server/app-origin";

const baseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth/google",
};

export const MERCHANT_AUTH_RETURN_COOKIE = "authReturnUrl";

export function resolveSafeMerchantReturnUrl(req: NextRequest, raw?: string | null): string | null {
  if (!raw?.trim()) return null;
  try {
    const origin = getAppOrigin(req);
    const parsed = new URL(raw.trim(), origin);
    if (parsed.origin !== new URL(origin).origin) return null;
    if (!parsed.pathname.startsWith("/")) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export function readMerchantReturnUrl(req: NextRequest): string | null {
  const fromCookie = req.cookies.get(MERCHANT_AUTH_RETURN_COOKIE)?.value?.trim();
  return resolveSafeMerchantReturnUrl(req, fromCookie);
}

export function setMerchantReturnUrlCookie(response: NextResponse, returnUrl: string) {
  response.cookies.set(MERCHANT_AUTH_RETURN_COOKIE, returnUrl, {
    ...baseOptions,
    maxAge: 600,
  });
}

export function clearMerchantReturnUrlCookie(response: NextResponse) {
  response.cookies.set(MERCHANT_AUTH_RETURN_COOKIE, "", {
    ...baseOptions,
    maxAge: 0,
  });
}
