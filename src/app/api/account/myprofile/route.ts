import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getUserIdFromAccessToken } from "@/lib/auth-user";
import { getAuthUpstreamUrl } from "@/lib/config";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

async function forwardToUpstream(req: Request, method: "GET" | "PATCH") {
  const cookieStore = await cookies();
  const accessToken = readAccessTokenFromCookies(cookieStore);
  if (!accessToken) {
    return NextResponse.json({ message: "Oturum gerekli" }, { status: 401 });
  }

  const userId = getUserIdFromAccessToken(accessToken);
  if (userId == null) {
    return NextResponse.json({ message: "Token'da kullanıcı bilgisi yok" }, { status: 401 });
  }

  const url = `${getAuthUpstreamUrl()}/account/myprofile`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "X-User-Id": String(userId),
    Accept: "application/json",
  };

  let upstream;
  if (method === "GET") {
    upstream = await axios.get(url, {
      headers,
      validateStatus: () => true,
      timeout: 20_000,
    });
  } else {
    const text = await req.text();
    let data: unknown = undefined;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        return NextResponse.json({ message: "Geçersiz JSON" }, { status: 400 });
      }
    }
    upstream = await axios.patch(url, data, {
      headers: { ...headers, "Content-Type": "application/json" },
      validateStatus: () => true,
      timeout: 20_000,
    });
  }

  if (upstream.status < 200 || upstream.status >= 300) {
    let message = String(upstream.data ?? "");
    if (typeof upstream.data === "object" && upstream.data != null) {
      const m = (upstream.data as { message?: string }).message;
      if (m) message = m;
    }
    return NextResponse.json({ message: message || "İstek başarısız" }, { status: upstream.status });
  }

  if (method === "GET") {
    return NextResponse.json(upstream.data as object);
  }
  if (method === "PATCH" && upstream.data != null && upstream.data !== "") {
    return NextResponse.json(upstream.data as object);
  }
  return new NextResponse(null, { status: upstream.status });
}

export async function GET(req: Request) {
  try {
    return await forwardToUpstream(req, "GET");
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    return await forwardToUpstream(req, "PATCH");
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
