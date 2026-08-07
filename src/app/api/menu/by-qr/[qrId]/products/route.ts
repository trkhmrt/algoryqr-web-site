import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildUpstreamAuthHeaders } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

export async function GET(req: Request, context: { params: Promise<{ qrId: string }> }) {
  try {
    const { qrId } = await context.params;
    const cookieStore = await cookies();
    const accessToken = readAccessTokenFromCookies(cookieStore);
    if (!accessToken) {
      return NextResponse.json({ message: "Access token yok" }, { status: 401 });
    }

    const url = new URL(req.url);
    const page = url.searchParams.get("page");
    const size = url.searchParams.get("size");
    const q = url.searchParams.get("q");
    const subCategoryId = url.searchParams.get("subCategoryId");
    const params: Record<string, string> = {};
    if (page != null) params.page = page;
    if (size != null) params.size = size;
    if (q != null && q !== "") params.q = q;
    if (subCategoryId != null && subCategoryId !== "") params.subCategoryId = subCategoryId;

    const upstream = await axios.get(`${API_BASE_URL}/menu/by-qr/${qrId}/products`, {
      headers: buildUpstreamAuthHeaders(accessToken),
      params,
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
