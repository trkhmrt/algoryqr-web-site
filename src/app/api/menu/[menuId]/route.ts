import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildUpstreamAuthHeaders } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

export async function PATCH(req: Request, context: { params: Promise<{ menuId: string }> }) {
  try {
    const cookieStore = await cookies();
    const accessToken = readAccessTokenFromCookies(cookieStore);
    if (!accessToken) return NextResponse.json({ message: "Access token yok" }, { status: 401 });

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

export async function DELETE(_req: Request, context: { params: Promise<{ menuId: string }> }) {
  try {
    const cookieStore = await cookies();
    const accessToken = readAccessTokenFromCookies(cookieStore);
    if (!accessToken) return NextResponse.json({ message: "Access token yok" }, { status: 401 });

    const { menuId } = await context.params;
    const upstream = await axios.delete(`${API_BASE_URL}/menu/${menuId}`, {
      headers: buildUpstreamAuthHeaders(accessToken),
      validateStatus: () => true,
      timeout: 20_000,
    });

    if (upstream.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(upstream.data ?? {}, { status: upstream.status });
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data ?? {}, { status: error.response.status });
    }
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
