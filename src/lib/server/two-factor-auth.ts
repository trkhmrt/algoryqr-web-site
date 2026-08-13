import { NextResponse } from "next/server";

import { getAccessProfileFromToken } from "@/lib/auth-user";

export const OAUTH_TWO_FACTOR_FORBIDDEN_MESSAGE =
  "Google hesabıyla giriş yapan kullanıcılar için 2FA kullanılamaz.";

/** Returns a 403 response when the access token belongs to a Google OAuth user. */
export function forbidGoogleOAuthTwoFactor(accessToken: string): NextResponse | null {
  const provider = getAccessProfileFromToken(accessToken).provider;
  if (provider !== "GOOGLE") return null;
  return NextResponse.json({ message: OAUTH_TWO_FACTOR_FORBIDDEN_MESSAGE }, { status: 403 });
}
