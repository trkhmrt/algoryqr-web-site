const trimTrailingSlash = (s: string) => s.replace(/\/$/, "");

const PROD_API_BASE = "https://prod.qrapi.algorycode.com";
const STAGE_API_BASE = "https://stage.qrapi.algorycode.com";

function readApiBaseFromEnv(): string | undefined {
  const raw = process.env.API_BASE_URL?.trim() || process.env.API_UPSTREAM?.trim();
  return raw ? trimTrailingSlash(raw) : undefined;
}

function readDeployEnv(): string {
  return (process.env.APP_ENV || process.env.DEPLOY_ENV || "").trim().toLowerCase();
}

function resolveApiBaseUrl(): string {
  const fromEnv = readApiBaseFromEnv();
  if (fromEnv) return fromEnv;

  const deployEnv = readDeployEnv();
  if (deployEnv === "prod" || deployEnv === "production") return PROD_API_BASE;
  if (deployEnv === "stage" || deployEnv === "staging") return STAGE_API_BASE;

  if (process.env.NODE_ENV === "development") return "http://localhost:8055";

  throw new Error("APP_ENV must be prod or stage, or set API_BASE_URL");
}

function resolvePaymentBaseUrl(): string {
  const fromEnv = process.env.PAYMENT_BASE_URL?.trim();
  if (fromEnv) return trimTrailingSlash(fromEnv);
  return "";
}

function resolveAppUrl(): string {
  const fromEnv = process.env.APP_URL?.trim();
  if (fromEnv) return trimTrailingSlash(fromEnv);
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
