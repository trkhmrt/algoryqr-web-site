import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthUpstreamUrl } from "@/lib/config";
import { getUserIdFromAccessToken } from "@/lib/auth-user";

/** Gateway: POST /authservice/2fa/setup → JSON (secret, qrImageBase64, otpAuthUri, …). */
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

    const upstream = await fetch(`${getAuthUpstreamUrl()}/2fa/setup`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-User-Id": String(userId),
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      let message = text;
      try {
        const j = JSON.parse(text) as { message?: string };
        if (j?.message) message = j.message;
      } catch {
        /* keep text */
      }
      return NextResponse.json({ message: message || "2FA kurulumu başarısız" }, { status: upstream.status });
    }

    try {
      const data = JSON.parse(text) as Record<string, unknown>;
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ message: "Geçersiz yanıt" }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
