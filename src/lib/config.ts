const trimTrailingSlash = (s: string) => s.replace(/\/$/, "");

const PROD_GATEWAY_DEFAULT = "https://gateway.algorycode.com";

/** Lokal geliştirme: `next dev` (NODE_ENV=development). */
function isLocalDev(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Gateway kökü (Auth: …/authservice, QR: …/qr).
 * Öncelik: env → geliştirmede localhost → aksi halde canlı varsayılan.
 */
function resolveGatewayBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_GATEWAY_BASE || process.env.GATEWAY_BASE;
  if (fromEnv) return trimTrailingSlash(fromEnv);
  if (isLocalDev()) return "http://localhost:8072";
  return PROD_GATEWAY_DEFAULT;
}

/**
 * AuthService kökü (doğrudan). Eski env / geriye dönük uyumluluk.
 * Sunucu tarafı proxy'ler için tercihen `getAuthUpstreamUrl()` kullanın.
 */
export const AUTH_BASE =
  process.env.AUTH_BASE ||
  process.env.NEXT_PUBLIC_AUTH_BASE ||
  "https://auth.algorycode.com";
export const API_BASE = AUTH_BASE;

/** QR vb. route'lar. Lokal `next dev`: varsayılan http://localhost:8072 */
export const GATEWAY_BASE = resolveGatewayBase();

/**
 * Next.js `/api/auth/*` → AuthService.
 * - `AUTH_UPSTREAM`: gateway bypass, doğrudan AuthService (örn. http://localhost:8099)
 * - Aksi halde: `{GATEWAY_BASE}/authservice` (lokalde varsayılan gateway http://localhost:8072)
 */
export function getAuthUpstreamUrl(): string {
  const direct =
    process.env.AUTH_UPSTREAM ||
    process.env.NEXT_PUBLIC_AUTH_UPSTREAM;
  if (direct) return trimTrailingSlash(direct);
  return `${resolveGatewayBase()}/authservice`;
}

/** Backend ile uyumlu: access token 5 dk (JWT expiration, ms) */
export const ACCESS_TOKEN_EXPIRY_MS = 300_000;
export const ACCESS_TOKEN_EXPIRY_SECONDS = ACCESS_TOKEN_EXPIRY_MS / 1000;
/** Girişten sonra en geç bu süre sonra refresh isteği atılır (2 dk) */
export const REFRESH_AFTER_LOGIN_MS = 2 * 60 * 1000;
/** Backend ile uyumlu: refresh token 30 gün */
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;
/** Cookie saklama süresi (saniye): 30 gün */
export const COOKIE_MAX_AGE_SECONDS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
/** 2FA bekleme JWT ile uyumlu (5 dk) */
export const TWO_FACTOR_PENDING_COOKIE_MAX_AGE_SECONDS = ACCESS_TOKEN_EXPIRY_SECONDS;

export const GOOGLE_CLIENT_ID =
  "990624623867-o83douun4e0vke2nur5qteo9pr4mmlf8.apps.googleusercontent.com";
