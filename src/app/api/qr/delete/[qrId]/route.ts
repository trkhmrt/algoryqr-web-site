import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GATEWAY_BASE } from "@/lib/config";

export async function DELETE(_req: Request, context: { params: Promise<{ qrId: string }> }) {
  try {
    const { qrId } = await context.params;
    const cookieStore = await cookies();
    const accessToken =
      cookieStore.get("algory_access_token")?.value ||
      cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json({ message: "Access token yok" }, { status: 401 });
    }

    const upstream = await fetch(`${GATEWAY_BASE}/qr/delete/${qrId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const raw = await upstream.text();
    let data: unknown = raw || "Deleted Success";

    try {
      data = raw ? JSON.parse(raw) : "Deleted Success";
    } catch {
      data = raw || "Deleted Success";
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
