import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildUpstreamAuthHeaders, tokenHasScope } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

export async function PATCH(req: Request, context: { params: Promise<{ menuId: string }> }) {
  try {
    const cookieStore = await cookies();
    const accessToken = readAccessTokenFromCookies(cookieStore);
    if (!accessToken) return NextResponse.json({ message: "Access token yok" }, { status: 401 });
    if (!tokenHasScope(accessToken, "QR_MENU_OWNER")) {
      return NextResponse.json({ message: "PRO paket gerekli" }, { status: 403 });
    }

    const { menuId } = await context.params;
    const body = await req.json();
    const upstream = await axios.patch(`${API_BASE_URL}/menu/${menuId}`, body, {
      headers: { ...buildUpstreamAuthHeaders(accessToken), "Content-Type": "application/json" },
      validateStatus: () => true,
      timeout: 20_000,
    });

    return NextResponse.json(upstream.data ?? {}, { status: upstream.status });
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data ?? {}, { status: error.response.status });
    }
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
