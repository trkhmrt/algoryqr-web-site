import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getUserIdFromAccessToken } from "@/lib/auth-user";
import { getAuthUpstreamUrl } from "@/lib/config";
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

    const upstream = await axios.post<ArrayBuffer>(
      `${getAuthUpstreamUrl()}/2fa/enabled`,
      undefined,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-User-Id": String(userId),
        },
        responseType: "arraybuffer",
        validateStatus: () => true,
        timeout: 20_000,
      },
    );

    if (upstream.status < 200 || upstream.status >= 300) {
      let message = "2FA kurulumu başarısız";
      try {
        const text = new TextDecoder().decode(upstream.data as ArrayBuffer);
        const j = JSON.parse(text) as { message?: string };
        if (j?.message) message = j.message;
      } catch {
        /* keep default */
      }
      return NextResponse.json({ message }, { status: upstream.status });
    }

    const buf = upstream.data as ArrayBuffer;
    const ct = String(upstream.headers["content-type"] || "image/png");
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: { "Content-Type": ct },
    });
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
