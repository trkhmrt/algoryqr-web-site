import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getUserIdFromAccessToken } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import { getJsonErrorText } from "@/lib/api-error-text";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

type Body = {
  code?: string;
  newPassword?: string;
  confirmPassword?: string;
};

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
    if (!body?.code || !body?.newPassword || !body?.confirmPassword) {
      return NextResponse.json(
        { message: "Kod, yeni şifre ve şifre tekrarı gerekli" },
        { status: 400 },
      );
    }

    const upstream = await axios.post(
      `${API_BASE_URL}/account/password-change/confirm`,
      {
        code: body.code,
        newPassword: body.newPassword,
        confirmPassword: body.confirmPassword,
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
      const message = getJsonErrorText(upstream.data) || "Şifre güncellenemedi";
      return NextResponse.json({ message }, { status: upstream.status });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
