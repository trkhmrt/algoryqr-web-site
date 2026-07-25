import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

import {
  getExpFromAccessToken,
  getUserIdFromAccessToken,
  isoToEpochSeconds,
} from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import {
  setAuthCookies,
  setTokenExpiryCookies,
} from "@/lib/server/auth-cookies";
import { getAppOrigin } from "@/lib/server/app-origin";
import { fetchCurrentSessionRefreshExpiresAt } from "@/lib/server/session-expiry";
import {
  type GoogleAuthErrorCode,
  googleAuthErrorRedirect,
  parseGoogleAuthIntent,
  safeGoogleAuthErrorCode,
} from "@/lib/server/google-auth-flow";

type RedeemResponse = {
  accessToken?: unknown;
  access_token?: unknown;
  refreshToken?: unknown;
  refresh_token?: unknown;
  userId?: unknown;
  intent?: unknown;
  code?: unknown;
  error?: unknown;
  accessTokenExpiresAt?: unknown;
  refreshTokenExpiresAt?: unknown;
  accessExpiresAt?: unknown;
  refreshExpiresAt?: unknown;
};

const TICKET_PATTERN = /^[A-Za-z0-9._~-]{16,512}$/;

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readPositiveNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }
  return undefined;
}

function errorForStatus(status: number): GoogleAuthErrorCode {
  if (status === 400 || status === 401 || status === 404) return "invalid_ticket";
  if (status === 409) return "ticket_used";
  if (status === 410) return "ticket_expired";
  if (status >= 500) return "upstream_unavailable";
  return "oauth_failed";
}

export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams;
  const requestedIntent =
    parseGoogleAuthIntent(searchParams.get("intent")) ??
    parseGoogleAuthIntent(req.cookies.get("googleAuthIntent")?.value) ??
    "login";
  const callbackError = searchParams.get("error");
  if (callbackError) {
    return googleAuthErrorRedirect(
      req,
      requestedIntent,
      safeGoogleAuthErrorCode(callbackError),
    );
  }

  const ticket = searchParams.get("ticket")?.trim() ?? "";
  if (!TICKET_PATTERN.test(ticket)) {
    return googleAuthErrorRedirect(req, requestedIntent, "invalid_ticket");
  }

  try {
    const upstream = await axios.post<RedeemResponse>(
      `${API_BASE_URL}/google-auth/redeem`,
      { ticket },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        timeout: 20_000,
        validateStatus: () => true,
      },
    );
    const data =
      typeof upstream.data === "object" && upstream.data != null
        ? upstream.data
        : {};
    const intent = parseGoogleAuthIntent(data.intent) ?? requestedIntent;

    if (upstream.status < 200 || upstream.status >= 300) {
      const upstreamCode = data.code ?? data.error;
      return googleAuthErrorRedirect(
        req,
        intent,
        safeGoogleAuthErrorCode(upstreamCode, errorForStatus(upstream.status)),
      );
    }

    const accessToken = readString(data.accessToken ?? data.access_token);
    const refreshToken = readString(data.refreshToken ?? data.refresh_token);
    if (!accessToken || !refreshToken) {
      return googleAuthErrorRedirect(req, intent, "oauth_failed");
    }

    const accessTokenExpiresAt =
      readPositiveNumber(data.accessTokenExpiresAt) ??
      isoToEpochSeconds(readString(data.accessExpiresAt)) ??
      getExpFromAccessToken(accessToken) ??
      undefined;
    const refreshTokenExpiresAt =
      readPositiveNumber(data.refreshTokenExpiresAt) ??
      isoToEpochSeconds(readString(data.refreshExpiresAt)) ??
      (await fetchCurrentSessionRefreshExpiresAt(accessToken));
    const userId =
      readPositiveNumber(data.userId) ??
      getUserIdFromAccessToken(accessToken) ??
      undefined;
    const response = NextResponse.redirect(
      new URL("/dashboard", getAppOrigin(req)),
      303,
    );
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.cookies.set("googleAuthIntent", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/google",
      maxAge: 0,
    });
    setAuthCookies(response, accessToken, refreshToken, userId);
    setTokenExpiryCookies(
      response,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    );
    return response;
  } catch {
    return googleAuthErrorRedirect(req, requestedIntent, "upstream_unavailable");
  }
}
