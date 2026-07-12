import { createHmac, timingSafeEqual } from "crypto";

export const THREE_DS_PENDING_COOKIE = "algory_three_ds_pending";
const TTL_MS = 30 * 60 * 1000;

export type ThreeDsPendingSession = {
  conversationId: string;
  packageId: number;
  userId: string;
  accessToken: string;
  refreshToken: string | null;
  exp: number;
};

function getSecret(): string {
  return (
    process.env.THREE_DS_STATE_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    "algory-three-ds-dev-secret"
  );
}

function signPayload(encoded: string): string {
  return createHmac("sha256", getSecret()).update(encoded).digest("base64url");
}

export function createThreeDsPendingToken(
  data: Omit<ThreeDsPendingSession, "exp">,
): string {
  const payload: ThreeDsPendingSession = { ...data, exp: Date.now() + TTL_MS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signPayload(encoded)}`;
}

export function readThreeDsPendingToken(token: string | undefined | null): ThreeDsPendingSession | null {
  if (!token?.includes(".")) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = signPayload(encoded);
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as ThreeDsPendingSession;
    if (
      typeof parsed.conversationId !== "string" ||
      typeof parsed.userId !== "string" ||
      typeof parsed.accessToken !== "string" ||
      typeof parsed.packageId !== "number" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Banka cross-site POST'unda gönderilebilmesi için SameSite=None gerekir. */
export function threeDsPendingCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    maxAge: TTL_MS / 1000,
    path: "/api/payments/three-ds/callback",
  };
}

export function clearThreeDsPendingCookie(response: { cookies: { set: (name: string, value: string, options: object) => void } }) {
  response.cookies.set(THREE_DS_PENDING_COOKIE, "", {
    ...threeDsPendingCookieOptions(),
    maxAge: 0,
  });
}
