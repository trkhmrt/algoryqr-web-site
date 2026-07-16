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

function resolvePublicApiBaseUrl(): string {
  const fromEnv = process.env.PUBLIC_API_BASE_URL?.trim();
  if (fromEnv) return trimTrailingSlash(fromEnv);

  const deployEnv = readDeployEnv();
  if (deployEnv === "prod" || deployEnv === "production") return PROD_API_BASE;
  if (deployEnv === "stage" || deployEnv === "staging") return STAGE_API_BASE;

  return resolveApiBaseUrl();
}

function resolveAppUrl(): string {
  const fromEnv = process.env.APP_URL?.trim();
  if (fromEnv) return trimTrailingSlash(fromEnv);
  return "";
}

export const API_BASE_URL = resolveApiBaseUrl();

export const PUBLIC_API_BASE_URL = resolvePublicApiBaseUrl();

export const APP_URL = resolveAppUrl();

export const QR_API_BASE = `${API_BASE_URL}/qr`;

export const ACCESS_TOKEN_EXPIRY_MS = 300_000;
export const ACCESS_TOKEN_EXPIRY_SECONDS = ACCESS_TOKEN_EXPIRY_MS / 1000;
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;
export const COOKIE_MAX_AGE_SECONDS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
export const TWO_FACTOR_PENDING_COOKIE_MAX_AGE_SECONDS = ACCESS_TOKEN_EXPIRY_SECONDS;
