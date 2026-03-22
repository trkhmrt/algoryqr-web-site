import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GATEWAY_BASE } from "@/lib/config";

export async function GET(_req: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await context.params;
    const cookieStore = await cookies();
    const accessToken =
      cookieStore.get("algory_access_token")?.value ||
      cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json({ message: "Access token yok" }, { status: 401 });
    }

    const upstream = await fetch(`${GATEWAY_BASE}/gateway/qr/user/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const raw = await upstream.text();
    let data: unknown = [];

    try {
      data = raw ? JSON.parse(raw) : [];
    } catch {
      data = { message: raw || "Beklenmeyen yanıt" };
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
