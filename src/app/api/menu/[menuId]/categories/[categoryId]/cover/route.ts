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

export async function POST(
  req: Request,
  context: { params: Promise<{ menuId: string; categoryId: string }> },
) {
  try {
    const headers = await authHeaders();
    if (!headers) return NextResponse.json({ message: "Access token yok" }, { status: 401 });

    const { menuId, categoryId } = await context.params;
    const formData = await req.formData();

    const upstream = await fetch(
      `${API_BASE_URL}/menu/${menuId}/categories/${categoryId}/cover`,
      {
        method: "POST",
        headers,
        body: formData,
      },
    );

    const text = await upstream.text();
    if (!text) {
      return new NextResponse(null, { status: upstream.status });
    }

    try {
      return NextResponse.json(JSON.parse(text), { status: upstream.status });
    } catch {
      return NextResponse.json({ message: text }, { status: upstream.status });
    }
  } catch {
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
      `${API_BASE_URL}/menu/${menuId}/categories/${categoryId}/cover`,
      {
        headers,
        validateStatus: () => true,
        timeout: 20_000,
      },
    );

    if (upstream.status === 204 || upstream.data == null || upstream.data === "") {
      return new NextResponse(null, { status: upstream.status });
    }
    return NextResponse.json(upstream.data, { status: upstream.status });
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data ?? {}, { status: error.response.status });
    }
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
