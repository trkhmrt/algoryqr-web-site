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

export async function POST(req: Request) {
  try {
    const headers = await authHeaders();
    if (!headers) return NextResponse.json({ message: "Access token yok" }, { status: 401 });

    const formData = await req.formData();

    const upstream = await fetch(`${API_BASE_URL}/platform-feedback/screenshot`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (upstream.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const text = await upstream.text();
    if (!text) {
      return new NextResponse(null, { status: upstream.status });
    }

    try {
      return NextResponse.json(JSON.parse(text), { status: upstream.status });
    } catch {
      return NextResponse.json({ message: text }, { status: upstream.status });
    }
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data ?? {}, { status: error.response.status });
    }
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
