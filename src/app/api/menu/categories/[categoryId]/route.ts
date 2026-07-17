import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildUpstreamAuthHeaders, tokenHasScope } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

export async function PUT(req: Request, context: { params: Promise<{ categoryId: string }> }) {
  try {
    const cookieStore = await cookies();
    const accessToken = readAccessTokenFromCookies(cookieStore);
    if (!accessToken) return NextResponse.json({ message: "Access token yok" }, { status: 401 });
    if (!tokenHasScope(accessToken, "QR_MENU_OWNER")) {
      return NextResponse.json({ message: "PRO paket gerekli" }, { status: 403 });
    }

    const { categoryId } = await context.params;
    const body = await req.json();
    const upstream = await axios.put(`${API_BASE_URL}/menu/categories/${categoryId}`, body, {
      headers: { ...buildUpstreamAuthHeaders(accessToken), "Content-Type": "application/json" },
      validateStatus: () => true,
      timeout: 20_000,
    });

    return NextResponse.json(upstream.data ?? {}, { status: upstream.status });
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data ?? {}, { status: error.response.status });
    }
    return NextResponse.json({ message: "Sunucu hatas?" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ categoryId: string }> }) {
  try {
    const cookieStore = await cookies();
    const accessToken = readAccessTokenFromCookies(cookieStore);
    if (!accessToken) return NextResponse.json({ message: "Access token yok" }, { status: 401 });
    if (!tokenHasScope(accessToken, "QR_MENU_OWNER")) {
      return NextResponse.json({ message: "PRO paket gerekli" }, { status: 403 });
    }

    const { categoryId } = await context.params;
    const upstream = await axios.delete(`${API_BASE_URL}/menu/categories/${categoryId}`, {
      headers: buildUpstreamAuthHeaders(accessToken),
      validateStatus: () => true,
      timeout: 20_000,
    });

    return NextResponse.json(upstream.data ?? null, { status: upstream.status });
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data ?? {}, { status: error.response.status });
    }
    return NextResponse.json({ message: "Sunucu hatas?" }, { status: 500 });
  }
}
