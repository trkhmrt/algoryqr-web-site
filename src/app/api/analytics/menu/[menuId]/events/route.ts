import axios, { AxiosError } from "axios";
import { NextResponse } from "next/server";

import { API_BASE_URL } from "@/lib/config";

export async function POST(
  request: Request,
  context: { params: Promise<{ menuId: string }> },
) {
  try {
    const { menuId } = await context.params;
    const body = await request.text();
    const clientUa =
      request.headers.get("x-client-user-agent") ||
      request.headers.get("user-agent") ||
      "";
    const forwardedFor =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "";

    const upstream = await axios.post(
      `${API_BASE_URL}/analytics/menu/${menuId}/events`,
      body ? JSON.parse(body) : {},
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(clientUa
            ? {
                "User-Agent": clientUa,
                "X-Client-User-Agent": clientUa,
              }
            : {}),
          ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
        },
        validateStatus: () => true,
        timeout: 15_000,
      },
    );

    if (upstream.status === 204 || upstream.data == null || upstream.data === "") {
      return new NextResponse(null, { status: upstream.status });
    }
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
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
