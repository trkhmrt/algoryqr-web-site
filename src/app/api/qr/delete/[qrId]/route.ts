import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { QR_GATEWAY_BASE } from "@/lib/config";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

export async function DELETE(_req: Request, context: { params: Promise<{ qrId: string }> }) {
  try {
    const { qrId } = await context.params;
    const cookieStore = await cookies();
    const accessToken = readAccessTokenFromCookies(cookieStore);

    if (!accessToken) {
      return NextResponse.json({ message: "Access token yok" }, { status: 401 });
    }

    const upstream = await axios.delete(`${QR_GATEWAY_BASE}/delete/${qrId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      validateStatus: () => true,
      timeout: 20_000,
    });

    const data = upstream.data ?? "Deleted Success";
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.code === "ECONNABORTED") {
        return NextResponse.json({ message: "Gateway timeout" }, { status: 504 });
      }
      if (error.response) {
        return NextResponse.json(error.response.data ?? "Deleted Success", { status: error.response.status });
      }
    }
    return NextResponse.json({ message: "Sunucu hatası", detail: String(error) }, { status: 500 });
  }
}
