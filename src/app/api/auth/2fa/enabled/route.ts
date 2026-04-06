import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthUpstreamUrl } from "@/lib/config";
import { getUserIdFromAccessToken } from "@/lib/auth-user";

/** Gateway: POST /authservice/2fa/enabled → AuthService /2fa/enabled (PNG). JWT zorunlu. */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const accessToken =
      cookieStore.get("algory_access_token")?.value ||
      cookieStore.get("accessToken")?.value;
    if (!accessToken) {
      return NextResponse.json({ message: "Oturum gerekli" }, { status: 401 });
    }

    const userId = getUserIdFromAccessToken(accessToken);
    if (userId == null) {
      return NextResponse.json({ message: "Token'da kullanıcı bilgisi yok" }, { status: 401 });
    }

    const upstream = await fetch(`${getAuthUpstreamUrl()}/2fa/enabled`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-User-Id": String(userId),
      },
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      let message = text;
      try {
        const j = JSON.parse(text) as { message?: string };
        if (j?.message) message = j.message;
      } catch {
        /* keep text */
      }
      return NextResponse.json({ message: message || "2FA kurulumu başarısız" }, { status: upstream.status });
    }

    const buf = await upstream.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: { "Content-Type": upstream.headers.get("content-type") || "image/png" },
    });
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
