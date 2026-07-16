import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_BASE_URL } from "@/lib/config";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ purchaseId: string }> },
) {
  try {
    const { purchaseId } = await params;
    if (!/^\d+$/.test(purchaseId)) {
      return NextResponse.json({ message: "Geçersiz satın alım id" }, { status: 400 });
    }
    const accessToken = readAccessTokenFromCookies(await cookies());
    if (!accessToken) {
      return NextResponse.json({ message: "Oturum gerekli" }, { status: 401 });
    }
    const upstream = await axios.get(`${API_BASE_URL}/purchases/${purchaseId}/installments`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      validateStatus: () => true,
      timeout: 20_000,
    });
    return NextResponse.json(upstream.data ?? {}, { status: upstream.status });
  } catch (error) {
    if (error instanceof AxiosError && error.code === "ECONNABORTED") {
      return NextResponse.json({ message: "Gateway timeout" }, { status: 504 });
    }
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
