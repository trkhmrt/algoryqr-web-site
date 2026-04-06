import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthUpstreamUrl } from "@/lib/config";
import { getUserIdFromAccessToken } from "@/lib/auth-user";

async function forwardToUpstream(req: Request, method: "GET" | "PATCH") {
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get("algory_access_token")?.value || cookieStore.get("accessToken")?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Oturum gerekli" }, { status: 401 });
  }

  const userId = getUserIdFromAccessToken(accessToken);
  if (userId == null) {
    return NextResponse.json({ message: "Token'da kullanıcı bilgisi yok" }, { status: 401 });
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "X-User-Id": String(userId),
  };

  let body: string | undefined;
  if (method === "PATCH") {
    const text = await req.text();
    if (text) {
      headers["Content-Type"] = "application/json";
      body = text;
    }
  }

  const upstream = await fetch(`${getAuthUpstreamUrl()}/account/myprofile`, {
    method,
    headers,
    body,
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
    return NextResponse.json({ message: message || "İstek başarısız" }, { status: upstream.status });
  }

  if (method === "GET" && text) {
    try {
      return NextResponse.json(JSON.parse(text) as object);
    } catch {
      return NextResponse.json({ message: "Geçersiz yanıt" }, { status: 502 });
    }
  }
  if (method === "PATCH" && text) {
    try {
      return NextResponse.json(JSON.parse(text) as object);
    } catch {
      return NextResponse.json({ message: "Geçersiz yanıt" }, { status: 502 });
    }
  }
  return new NextResponse(null, { status: upstream.status });
}

/** Gateway: GET/PATCH /authservice/account/myprofile — JWT zorunlu. */
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
