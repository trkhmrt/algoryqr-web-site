import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GATEWAY_BASE } from "@/lib/config";
import { getUserFromAccessToken } from "@/lib/auth-user";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken =
      cookieStore.get("algory_access_token")?.value ||
      cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      console.error("[qr/create] access token missing in cookies");
      return NextResponse.json({ message: "Access token yok" }, { status: 401 });
    }

    console.log("[qr/create] token found", { tokenPreview: `${accessToken.slice(0, 12)}...`, tokenLength: accessToken.length });
    const authUser = getUserFromAccessToken(accessToken);
    const userId = authUser?.id;

    if (!userId) {
      console.error("[qr/create] user id missing in token");
      return NextResponse.json({ message: "Token içinde userId yok" }, { status: 401 });
    }

    const body = await req.json() as { qrName: string; type: string; details: unknown };
    const requestBody = JSON.stringify({
      ...body,
      userId: Number.isNaN(Number(userId)) ? userId : Number(userId),
    });
    console.log("[qr/create] request body", requestBody);
    const upstream = await fetch(`${GATEWAY_BASE}/qr/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: requestBody,
      cache: "no-store",
    });

    const raw = await upstream.text();
    console.log("[qr/create] upstream response", { status: upstream.status, body: raw });
    let data: unknown = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { message: raw || "Beklenmeyen yanıt" };
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("[qr/create] route error", error);
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
