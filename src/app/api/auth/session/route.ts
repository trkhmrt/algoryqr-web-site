import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAccessProfileFromToken } from "@/lib/auth-user";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = readAccessTokenFromCookies(cookieStore);
  if (!accessToken) {
    return NextResponse.json({ message: "Oturum gerekli" }, { status: 401 });
  }
  return NextResponse.json(getAccessProfileFromToken(accessToken));
}
