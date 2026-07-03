import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getUserFromAccessToken } from "@/lib/auth-user";
import { QR_GATEWAY_BASE } from "@/lib/config";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = readAccessTokenFromCookies(cookieStore);

    if (!accessToken) {
      return NextResponse.json({ message: "Access token yok" }, { status: 401 });
    }

    const authUser = getUserFromAccessToken(accessToken);
    const userId = authUser?.id;

    if (!userId) {
      return NextResponse.json({ message: "Token içinde userId yok" }, { status: 401 });
    }

    const body = (await req.json()) as { qrName: string; type: string; details: unknown };
    const requestBody = {
      ...body,
      userId: Number.isNaN(Number(userId)) ? userId : Number(userId),
    };

    const upstream = await axios.post(`${QR_GATEWAY_BASE}/create`, requestBody, {
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
