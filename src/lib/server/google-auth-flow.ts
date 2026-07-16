import { NextResponse } from "next/server";

import { getAppOrigin } from "@/lib/server/app-origin";

export type GoogleAuthIntent = "login" | "register";

export type GoogleAuthErrorCode =
  | "access_denied"
  | "account_exists"
  | "account_not_found"
  | "email_not_verified"
  | "google_auth_failed"
  | "invalid_intent"
  | "invalid_ticket"
  | "oauth_failed"
  | "provider_conflict"
  | "registration_failed"
  | "ticket_expired"
  | "ticket_used"
  | "upstream_unavailable";

const ERROR_CODES = new Set<GoogleAuthErrorCode>([
  "access_denied",
  "account_exists",
  "account_not_found",
  "email_not_verified",
  "google_auth_failed",
  "invalid_intent",
  "invalid_ticket",
  "oauth_failed",
  "provider_conflict",
  "registration_failed",
  "ticket_expired",
  "ticket_used",
  "upstream_unavailable",
]);

export function parseGoogleAuthIntent(value: unknown): GoogleAuthIntent | null {
  return value === "login" || value === "register" ? value : null;
}

export function safeGoogleAuthErrorCode(
  value: unknown,
  fallback: GoogleAuthErrorCode = "oauth_failed",
): GoogleAuthErrorCode {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  return ERROR_CODES.has(normalized as GoogleAuthErrorCode)
    ? (normalized as GoogleAuthErrorCode)
    : fallback;
}

export function googleAuthErrorRedirect(
  req: Request,
  intent: GoogleAuthIntent,
  error: GoogleAuthErrorCode,
): NextResponse {
  const target = new URL(intent === "register" ? "/register" : "/login", getAppOrigin(req));
  target.searchParams.set("error", error);
  const response = NextResponse.redirect(target, 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.cookies.set("googleAuthIntent", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 0,
  });
  return response;
}
