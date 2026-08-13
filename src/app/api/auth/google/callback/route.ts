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
import { clientContextHeaders } from "@/lib/server/client-headers";
import {
  CUSTOMER_OAUTH_RETURN_COOKIE,
  clearCustomerOAuthReturnCookie,
  setCustomerAuthCookies,
} from "@/lib/server/customer-auth-cookies";
import { fetchCurrentSessionRefreshExpiresAt } from "@/lib/server/session-expiry";
import {
  type GoogleAuthErrorCode,
  googleAuthErrorRedirect,
  isCustomerGoogleAuthIntent,
  parseAnyGoogleAuthIntent,
  parseGoogleAuthIntent,
  safeGoogleAuthErrorCode,
} from "@/lib/server/google-auth-flow";

type RedeemResponse = {
  accessToken?: unknown;
  access_token?: unknown;
  refreshToken?: unknown;
  refresh_token?: unknown;
  userId?: unknown;
  customerId?: unknown;
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

function resolveCustomerReturnUrl(req: NextRequest): string {
  const fromCookie = req.cookies.get(CUSTOMER_OAUTH_RETURN_COOKIE)?.value?.trim();
  if (fromCookie) {
    try {
      const parsed = new URL(fromCookie, getAppOrigin(req));
      if (parsed.origin === new URL(getAppOrigin(req)).origin) {
        return parsed.toString();
      }
    } catch {
      /* fall through */
    }
  }
  return new URL("/", getAppOrigin(req)).toString();
}

export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams;
  const cookieIntent = req.cookies.get("googleAuthIntent")?.value;
  const requestedIntent =
    parseAnyGoogleAuthIntent(searchParams.get("intent")) ??
    parseAnyGoogleAuthIntent(cookieIntent) ??
    "login";
  const customerReturnUrl = isCustomerGoogleAuthIntent(requestedIntent)
    ? resolveCustomerReturnUrl(req)
    : null;

  const callbackError = searchParams.get("error");
  if (callbackError) {
    return googleAuthErrorRedirect(
      req,
      requestedIntent,
      safeGoogleAuthErrorCode(callbackError),
      customerReturnUrl,
    );
  }

  const ticket = searchParams.get("ticket")?.trim() ?? "";
  if (!TICKET_PATTERN.test(ticket)) {
    return googleAuthErrorRedirect(req, requestedIntent, "invalid_ticket", customerReturnUrl);
  }

  try {
    const upstream = await axios.post<RedeemResponse>(
      `${API_BASE_URL}/google-auth/redeem`,
      { ticket },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...clientContextHeaders(req),
        },
        timeout: 20_000,
        validateStatus: () => true,
      },
    );
    const data =
      typeof upstream.data === "object" && upstream.data != null
        ? upstream.data
        : {};
    const intent = parseAnyGoogleAuthIntent(data.intent) ?? requestedIntent;

    if (upstream.status < 200 || upstream.status >= 300) {
      const upstreamCode = data.code ?? data.error;
      return googleAuthErrorRedirect(
        req,
        intent,
        safeGoogleAuthErrorCode(upstreamCode, errorForStatus(upstream.status)),
        customerReturnUrl,
      );
    }

    const accessToken = readString(data.accessToken ?? data.access_token);
    const refreshToken = readString(data.refreshToken ?? data.refresh_token);
    if (!accessToken || !refreshToken) {
      return googleAuthErrorRedirect(req, intent, "oauth_failed", customerReturnUrl);
    }

    const clearGoogleIntentCookie = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/api/auth/google",
      maxAge: 0,
    };

    if (isCustomerGoogleAuthIntent(intent)) {
      const customerId =
        readPositiveNumber(data.customerId) ??
        readPositiveNumber(data.userId) ??
        getUserIdFromAccessToken(accessToken) ??
        undefined;
      const response = NextResponse.redirect(
        customerReturnUrl ?? new URL("/", getAppOrigin(req)).toString(),
        303,
      );
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("Referrer-Policy", "no-referrer");
      response.cookies.set("googleAuthIntent", "", clearGoogleIntentCookie);
      clearCustomerOAuthReturnCookie(response);
      setCustomerAuthCookies(response, accessToken, refreshToken, customerId);
      return response;
    }

    const merchantIntent = parseGoogleAuthIntent(intent) ?? "login";

    if (merchantIntent === "register") {
      const registerUrl = new URL("/register", getAppOrigin(req));
      registerUrl.searchParams.set("registered", "1");
      const response = NextResponse.redirect(registerUrl, 303);
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("Referrer-Policy", "no-referrer");
      response.cookies.set("googleAuthIntent", "", clearGoogleIntentCookie);
      return response;
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
    response.cookies.set("googleAuthIntent", "", clearGoogleIntentCookie);
    setAuthCookies(response, accessToken, refreshToken, userId);
    setTokenExpiryCookies(
      response,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    );
    return response;
  } catch {
    return googleAuthErrorRedirect(
      req,
      requestedIntent,
      "upstream_unavailable",
      customerReturnUrl,
    );
  }
}
