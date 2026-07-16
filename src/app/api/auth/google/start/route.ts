import { NextResponse } from "next/server";

import { PUBLIC_API_BASE_URL } from "@/lib/config";
import {
  googleAuthErrorRedirect,
  parseGoogleAuthIntent,
} from "@/lib/server/google-auth-flow";

export function GET(req: Request) {
  const intent = parseGoogleAuthIntent(new URL(req.url).searchParams.get("intent"));
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
  return response;
}
