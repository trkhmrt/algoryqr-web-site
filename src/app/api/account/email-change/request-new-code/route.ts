import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getUserIdFromAccessToken } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import { getJsonErrorText } from "@/lib/api-error-text";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

type Body = { challengeId?: string; currentEmail?: string; newEmail?: string };

export async function POST(req: Request) {
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

    const body = (await req.json()) as Body;
    if (!body?.challengeId || !body?.currentEmail || !body?.newEmail) {
      return NextResponse.json({ message: "challengeId, mevcut e-posta ve yeni e-posta gerekli" }, { status: 400 });
    }

    const upstream = await axios.post(
      `${API_BASE_URL}/account/email-change/request-new-code`,
      {
        challengeId: body.challengeId,
        currentEmail: body.currentEmail,
        newEmail: body.newEmail,
      },
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
      const message = getJsonErrorText(upstream.data) || "Kod gönderilemedi";
      return NextResponse.json({ message }, { status: upstream.status });
    }

    return NextResponse.json(upstream.data, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
