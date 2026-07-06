function resolveApiBaseUrl(): string {
  const fromEnv = process.env.API_BASE_URL;
  if (fromEnv) return fromEnv.trim();
  if (process.env.NODE_ENV === "development") return "http://localhost:8055";
  return "";
}

function resolvePaymentBaseUrl(): string {
  const fromEnv = process.env.PAYMENT_BASE_URL;
  if (fromEnv) return fromEnv.trim();
  return "";
}

function resolveAppUrl(): string {
  const fromEnv = process.env.APP_URL;
  if (fromEnv) return fromEnv.trim().replace(/\/$/, "");
  return "";
}

/** Auth, QR, paket vb. upstream istekleri — `API_BASE_URL` env ile verilir. */
export const API_BASE_URL = resolveApiBaseUrl();

/** Ödeme servisi istekleri — `PAYMENT_BASE_URL` env ile verilir. */
export const PAYMENT_BASE_URL = resolvePaymentBaseUrl();

/** Tarayıcıya dönülen public site kökü — Docker/reverse proxy'de zorunlu. */
export const APP_URL = resolveAppUrl();

export const QR_API_BASE = `${API_BASE_URL}/qr`;

export const ACCESS_TOKEN_EXPIRY_MS = 300_000;
export const ACCESS_TOKEN_EXPIRY_SECONDS = ACCESS_TOKEN_EXPIRY_MS / 1000;
export const REFRESH_AFTER_LOGIN_MS = 2 * 60 * 1000;
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;
export const COOKIE_MAX_AGE_SECONDS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
export const TWO_FACTOR_PENDING_COOKIE_MAX_AGE_SECONDS = ACCESS_TOKEN_EXPIRY_SECONDS;

export const GOOGLE_CLIENT_ID =
  "990624623867-o83douun4e0vke2nur5qteo9pr4mmlf8.apps.googleusercontent.com";
