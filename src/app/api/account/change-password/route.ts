import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getUserIdFromAccessToken } from "@/lib/auth-user";
import { getAuthUpstreamUrl } from "@/lib/config";
import { getJsonErrorText } from "@/lib/api-error-text";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

type Body = { currentPassword?: string; newPassword?: string };

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
    if (!body?.currentPassword || !body?.newPassword) {
      return NextResponse.json({ message: "Mevcut şifre ve yeni şifre gerekli" }, { status: 400 });
    }

    const upstream = await axios.post(
      `${getAuthUpstreamUrl()}/account/change-password`,
      {
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
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
      const message = getJsonErrorText(upstream.data) || String(upstream.data ?? "") || "Şifre değiştirilemedi";
      return NextResponse.json({ message }, { status: upstream.status });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
