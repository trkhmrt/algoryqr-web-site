import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthUpstreamUrl } from "@/lib/config";
import { getUserIdFromAccessToken } from "@/lib/auth-user";
import {
  getJsonErrorText,
  isLikelyWrongTotpBackendText,
  TOTP_WRONG_USER_MESSAGE,
} from "@/lib/api-error-text";

type Body = { code?: string };

/** Gateway: POST /authservice/2fa/active → AuthService /2fa/active. JWT zorunlu. */
export async function POST(req: Request) {
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

    const body = (await req.json()) as Body;
    if (!body?.code || !/^\d{6}$/.test(String(body.code).trim())) {
      return NextResponse.json({ message: "Geçerli 6 haneli kod gerekli" }, { status: 400 });
    }

    const upstream = await fetch(`${getAuthUpstreamUrl()}/2fa/active`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-User-Id": String(userId),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code: String(body.code).trim() }),
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      let message = text;
      try {
        const j = JSON.parse(text) as unknown;
        const from = getJsonErrorText(j);
        if (from) message = from;
      } catch {
        /* keep text */
      }
      if (upstream.status === 500 && isLikelyWrongTotpBackendText(message)) {
        message = TOTP_WRONG_USER_MESSAGE;
      } else if (upstream.status === 401) {
        const m = String(message).toLowerCase();
        if (!m.trim() || !text?.trim()) {
          message = "Oturum doğrulanamadı. Yeniden giriş yapın.";
        } else if (/oturum|token|giriş|yetkisiz/i.test(m)) {
          /* olduğu gibi */
        } else {
          message = TOTP_WRONG_USER_MESSAGE;
        }
      }
      return NextResponse.json({ message: message || "Doğrulama başarısız" }, { status: upstream.status });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
