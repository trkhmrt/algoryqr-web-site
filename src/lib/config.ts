/** Canlı auth backend. Local test için .env.local ile AUTH_BASE=http://localhost:8099 override edilebilir. */
export const AUTH_BASE =
  process.env.AUTH_BASE ||
  process.env.NEXT_PUBLIC_AUTH_BASE ||
  "https://auth.algorycode.com";
export const API_BASE = AUTH_BASE;

export const GATEWAY_BASE =
  process.env.NEXT_PUBLIC_GATEWAY_BASE ||
  process.env.GATEWAY_BASE ||
  "https://gateway.algorycode.com";

/** Backend ile uyumlu: access token 5 dk (JWT expiration, ms) */
export const ACCESS_TOKEN_EXPIRY_MS = 300_000;
export const ACCESS_TOKEN_EXPIRY_SECONDS = ACCESS_TOKEN_EXPIRY_MS / 1000;
/** Girişten sonra en geç bu süre sonra refresh isteği atılır (2 dk) */
export const REFRESH_AFTER_LOGIN_MS = 2 * 60 * 1000;
/** Backend ile uyumlu: refresh token 30 gün */
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;
/** Cookie saklama süresi (saniye): 30 gün */
export const COOKIE_MAX_AGE_SECONDS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;

export const GOOGLE_CLIENT_ID =
  "990624623867-o83douun4e0vke2nur5qteo9pr4mmlf8.apps.googleusercontent.com";
