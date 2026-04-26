import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { QR_GATEWAY_BASE } from "@/lib/config";

export async function PUT(req: Request, context: { params: Promise<{ qrId: string }> }) {
  try {
    const { qrId } = await context.params;
    const cookieStore = await cookies();
    const accessToken =
      cookieStore.get("algory_access_token")?.value ||
      cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json({ message: "Access token yok" }, { status: 401 });
    }

    const body = await req.text();
    const upstream = await fetch(`${QR_GATEWAY_BASE}/update/${qrId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body,
      cache: "no-store",
    });

    const raw = await upstream.text();
    let data: unknown = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { message: raw || "Beklenmeyen yanıt" };
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
