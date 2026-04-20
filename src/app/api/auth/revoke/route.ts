import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAuthUpstreamUrl } from "@/lib/config";
import { readRefreshTokenFromCookies } from "@/lib/server/auth-cookies";

/** Backend refresh iptali; upstream sözleşmesi: `Cookie: refresh_token=…` (rent-fe’de yok, korunuyor). */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = readRefreshTokenFromCookies(cookieStore);

    if (!refreshToken) {
      return NextResponse.json({ message: "Refresh token yok" }, { status: 401 });
    }

    const upstream = await axios.post(
      `${getAuthUpstreamUrl()}/basicauth/revoke-refreshtoken`,
      null,
      {
        headers: { Cookie: `refresh_token=${refreshToken}` },
        validateStatus: () => true,
        timeout: 15_000,
      },
    );

    return NextResponse.json(
      upstream.status >= 200 && upstream.status < 300 ? { ok: true } : { message: "İptal başarısız" },
      { status: upstream.status >= 200 && upstream.status < 300 ? 200 : upstream.status || 400 },
    );
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
