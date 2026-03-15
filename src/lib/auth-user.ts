export interface AuthUser {
  id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

type JwtPayload = Record<string, unknown>;

function decodeBase64Url(input: string): string | null {
  try {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return Buffer.from(padded, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

function parseJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payloadRaw = decodeBase64Url(parts[1]);
  if (!payloadRaw) return null;
  try {
    return JSON.parse(payloadRaw) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * JWT access token'dan exp (saniye cinsinden epoch) döner; yoksa null.
 * Backend exp'i bazen ms veriyor (örn. Spring 300000 ms); > 1e12 ise ms kabul edip saniyeye çeviriyoruz.
 */
export function getExpFromAccessToken(token?: string | null): number | null {
  if (!token) return null;
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return null;
  const exp = payload.exp;
  if (exp >= 1e12) return Math.floor(exp / 1000);
  return exp;
}

export function getUserFromAccessToken(token?: string | null): AuthUser | null {
  if (!token) return null;
  const payload = parseJwtPayload(token);
  if (!payload) return null;

  const email = (payload.email as string | undefined) || "";
  const firstName = (payload.firstName as string | undefined) || (payload.first_name as string | undefined);
  const lastName = (payload.lastName as string | undefined) || (payload.last_name as string | undefined);
  const userId =
    (payload.customerId as string | number | undefined) ||
    (payload.sub as string | number | undefined) ||
    (payload.userId as string | number | undefined);

  if (!email && !firstName && !lastName) return null;

  return {
    id: userId != null ? String(userId) : undefined,
    email: email || "",
    first_name: firstName,
    last_name: lastName,
  };
}
