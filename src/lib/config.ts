const trimTrailingSlash = (s: string) => s.replace(/\/$/, "");

function resolveGatewayBase(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_GATEWAY_BASE || process.env.GATEWAY_BASE;
  if (fromEnv) return trimTrailingSlash(fromEnv);
  if (process.env.NODE_ENV === "development") return "http://localhost:8072";
  return "https://gateway.algorycode.com";
}

export const GATEWAY_BASE = resolveGatewayBase();

export const QR_GATEWAY_BASE = `${GATEWAY_BASE}/qr`;

export const AUTH_BASE =
  process.env.AUTH_BASE ||
  process.env.NEXT_PUBLIC_AUTH_BASE ||
  "https://auth.algorycode.com";
export const API_BASE = AUTH_BASE;

export function getAuthUpstreamUrl(): string {
  const direct =
    process.env.AUTH_UPSTREAM || process.env.NEXT_PUBLIC_AUTH_UPSTREAM;
  if (direct) return trimTrailingSlash(direct);
  return `${resolveGatewayBase()}/authservice`;
}

export const ACCESS_TOKEN_EXPIRY_MS = 300_000;
export const ACCESS_TOKEN_EXPIRY_SECONDS = ACCESS_TOKEN_EXPIRY_MS / 1000;
export const REFRESH_AFTER_LOGIN_MS = 2 * 60 * 1000;
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;
export const COOKIE_MAX_AGE_SECONDS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
export const TWO_FACTOR_PENDING_COOKIE_MAX_AGE_SECONDS = ACCESS_TOKEN_EXPIRY_SECONDS;

export const GOOGLE_CLIENT_ID =
  "990624623867-o83douun4e0vke2nur5qteo9pr4mmlf8.apps.googleusercontent.com";
