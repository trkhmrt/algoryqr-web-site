import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getUserIdFromAccessToken } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import { getJsonErrorText } from "@/lib/api-error-text";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

async function forwardAuthorizedPost(path: string, body?: unknown) {
  const cookieStore = await cookies();
  const accessToken = readAccessTokenFromCookies(cookieStore);
  if (!accessToken) {
    return NextResponse.json({ message: "Oturum gerekli" }, { status: 401 });
  }

  const userId = getUserIdFromAccessToken(accessToken);
  if (userId == null) {
    return NextResponse.json({ message: "Token'da kullanıcı bilgisi yok" }, { status: 401 });
  }

  const upstream = await axios.post(`${API_BASE_URL}${path}`, body ?? {}, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-User-Id": String(userId),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    validateStatus: () => true,
    timeout: 20_000,
  });

  if (upstream.status < 200 || upstream.status >= 300) {
    const message = getJsonErrorText(upstream.data) || "İşlem başarısız";
    return NextResponse.json({ message }, { status: upstream.status });
  }

  if (upstream.status === 204 || upstream.data == null || upstream.data === "") {
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json(upstream.data, { status: 200 });
}

export async function POST() {
  try {
    return await forwardAuthorizedPost("/account/email-change/request-current-code");
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
