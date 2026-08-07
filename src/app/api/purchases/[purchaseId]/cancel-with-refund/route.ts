import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_BASE_URL } from "@/lib/config";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ purchaseId: string }> },
) {
  try {
    const { purchaseId } = await params;
    if (!/^\d+$/.test(purchaseId)) {
      return NextResponse.json({ message: "Gecersiz satin alim id" }, { status: 400 });
    }
    const accessToken = readAccessTokenFromCookies(await cookies());
    if (!accessToken) {
      return NextResponse.json({ message: "Oturum gerekli" }, { status: 401 });
    }
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const upstream = await axios.post(
      `${API_BASE_URL}/purchases/${purchaseId}/cancel-with-refund`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
          ...(!forwardedFor && realIp ? { "X-Forwarded-For": realIp } : {}),
        },
        validateStatus: () => true,
        timeout: 30_000,
      },
    );
    return NextResponse.json(upstream.data ?? {}, { status: upstream.status });
  } catch (error) {
    if (error instanceof AxiosError && error.code === "ECONNABORTED") {
      return NextResponse.json({ message: "Gateway timeout" }, { status: 504 });
    }
    return NextResponse.json({ message: "Sunucu hatasi" }, { status: 500 });
  }
}
