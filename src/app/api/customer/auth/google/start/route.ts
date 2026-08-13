import { NextResponse } from "next/server";

import { PUBLIC_API_BASE_URL } from "@/lib/config";
import { getAppOrigin } from "@/lib/server/app-origin";
import {
  setCustomerOAuthReturnCookie,
} from "@/lib/server/customer-auth-cookies";
import {
  parseCustomerGoogleAuthIntent,
  safeGoogleAuthErrorCode,
} from "@/lib/server/google-auth-flow";

export function GET(req: Request) {
  const url = new URL(req.url);
  const intent = parseCustomerGoogleAuthIntent(url.searchParams.get("intent"));
  if (!intent) {
    const target = new URL("/", getAppOrigin(req));
    target.searchParams.set("error", safeGoogleAuthErrorCode("invalid_intent"));
    return NextResponse.redirect(target, 303);
  }

  const returnUrlRaw = url.searchParams.get("returnUrl")?.trim() ?? "";
  const origin = getAppOrigin(req);
  let returnUrl = `${origin}/`;
  if (returnUrlRaw) {
    try {
      const parsed = new URL(returnUrlRaw, origin);
      if (parsed.origin === new URL(origin).origin) {
        returnUrl = parsed.toString();
      }
    } catch {
      /* keep default */
    }
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
  setCustomerOAuthReturnCookie(response, returnUrl);
  return response;
}
