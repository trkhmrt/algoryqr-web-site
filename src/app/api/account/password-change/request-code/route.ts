import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getUserIdFromAccessToken } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import { getJsonErrorText } from "@/lib/api-error-text";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const accessToken = readAccessTokenFromCookies(cookieStore);
    if (!accessToken) {
      return NextResponse.json({ message: "Oturum gerekli" }, { status: 401 });
    }

    const userId = getUserIdFromAccessToken(accessToken);
    if (userId == null) {
      return NextResponse.json({ message: "Token'da kullanıcı bilgisi yok" }, { status: 401 });
    }

    const upstream = await axios.post(
      `${API_BASE_URL}/account/password-change/request-code`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-User-Id": String(userId),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        validateStatus: () => true,
        timeout: 20_000,
      },
    );

    if (upstream.status < 200 || upstream.status >= 300) {
      const message = getJsonErrorText(upstream.data) || "Doğrulama kodu gönderilemedi";
      return NextResponse.json({ message }, { status: upstream.status });
    }

    return NextResponse.json(upstream.data, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
