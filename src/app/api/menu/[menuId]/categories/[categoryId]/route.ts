import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildUpstreamAuthHeaders } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

async function authHeaders() {
  const cookieStore = await cookies();
  const accessToken = readAccessTokenFromCookies(cookieStore);
  if (!accessToken) return null;
  return buildUpstreamAuthHeaders(accessToken);
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ menuId: string; categoryId: string }> },
) {
  try {
    const headers = await authHeaders();
    if (!headers) return NextResponse.json({ message: "Access token yok" }, { status: 401 });

    const { menuId, categoryId } = await context.params;
    const body = await req.json();
    const upstream = await axios.put(
      `${API_BASE_URL}/menu/${menuId}/categories/${categoryId}`,
      body,
      {
        headers: { ...headers, "Content-Type": "application/json" },
        validateStatus: () => true,
        timeout: 20_000,
      },
    );

    return NextResponse.json(upstream.data ?? {}, { status: upstream.status });
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data ?? {}, { status: error.response.status });
    }
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ menuId: string; categoryId: string }> },
) {
  try {
    const headers = await authHeaders();
    if (!headers) return NextResponse.json({ message: "Access token yok" }, { status: 401 });

    const { menuId, categoryId } = await context.params;
    const upstream = await axios.delete(
      `${API_BASE_URL}/menu/${menuId}/categories/${categoryId}`,
      {
        headers,
        validateStatus: () => true,
        timeout: 20_000,
      },
    );

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
