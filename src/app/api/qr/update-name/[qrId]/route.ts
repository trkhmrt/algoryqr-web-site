import { cookies } from "next/headers";
import axios, { AxiosError } from "axios";
import { NextResponse } from "next/server";
import { QR_GATEWAY_BASE } from "@/lib/config";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

export async function PATCH(req: Request, context: { params: Promise<{ qrId: string }> }) {
  try {
    const { qrId } = await context.params;
    const cookieStore = await cookies();
    const accessToken = readAccessTokenFromCookies(cookieStore);

    if (!accessToken) {
      return NextResponse.json({ message: "Access token yok" }, { status: 401 });
    }

    const body = await req.json();
    const upstream = await axios.patch(`${QR_GATEWAY_BASE}/update-name/${qrId}`, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      validateStatus: () => true,
      timeout: 20_000,
    });

    return NextResponse.json(upstream.data ?? {}, { status: upstream.status });
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.code === "ECONNABORTED") {
        return NextResponse.json({ message: "Gateway timeout" }, { status: 504 });
      }
      if (error.response) {
        return NextResponse.json(error.response.data ?? {}, { status: error.response.status });
      }
    }
    return NextResponse.json({ message: "Sunucu hatası", detail: String(error) }, { status: 500 });
  }
}
