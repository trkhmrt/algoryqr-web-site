import axios, { AxiosError } from "axios";
import { NextResponse } from "next/server";

import { API_BASE_URL } from "@/lib/config";

function clientHeaders(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const userAgent = req.headers.get("user-agent");
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
    ...(!forwardedFor && realIp ? { "X-Forwarded-For": realIp } : {}),
    ...(userAgent ? { "User-Agent": userAgent } : {}),
  };
}

export async function POST(
  req: Request,
  context: { params: Promise<{ identifier: string }> },
) {
  try {
    const { identifier } = await context.params;
    const body = await req.json().catch(() => ({}));
    const upstream = await axios.post(
      `${API_BASE_URL}/menu/public/${identifier}/reservations`,
      body,
      {
        headers: clientHeaders(req),
        validateStatus: () => true,
        timeout: 20_000,
      },
    );
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
    return NextResponse.json({ message: "Sunucu hatası", detail: String(error) }, { status: 500 });
  }
}
