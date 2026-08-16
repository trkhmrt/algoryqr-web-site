import { NextRequest, NextResponse } from "next/server";

import { PUBLIC_API_BASE_URL } from "@/lib/config";
import {
  setMerchantReturnUrlCookie,
  resolveSafeMerchantReturnUrl,
} from "@/lib/server/merchant-auth-cookies";
import {
  googleAuthErrorRedirect,
  parseGoogleAuthIntent,
} from "@/lib/server/google-auth-flow";

export function GET(req: NextRequest) {
  const url = new URL(req.url);
  const intent = parseGoogleAuthIntent(url.searchParams.get("intent"));
  if (!intent) {
    return googleAuthErrorRedirect(req, "login", "invalid_intent");
  }

  const authorizeUrl = new URL(`${PUBLIC_API_BASE_URL}/google-auth/authorize`);
  authorizeUrl.searchParams.set("intent", intent);
  const response = NextResponse.redirect(authorizeUrl, 307);
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set("googleAuthIntent", intent, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });

  const returnUrl = resolveSafeMerchantReturnUrl(req, url.searchParams.get("returnUrl"));
  if (returnUrl) {
    setMerchantReturnUrlCookie(response, returnUrl);
  }

  return response;
}
