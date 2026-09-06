import axios, { AxiosError } from "axios";
import { NextResponse } from "next/server";

import { API_BASE_URL } from "@/lib/config";

export async function POST(
  request: Request,
  context: { params: Promise<{ identifier: string }> },
) {
  try {
    const { identifier } = await context.params;
    const text = await request.text();
    let data: unknown;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        return NextResponse.json({ message: "Geçersiz JSON" }, { status: 400 });
      }
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");

    const upstream = await axios.post(
      `${API_BASE_URL}/menu/public/${identifier}/table-session`,
      data,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
          ...(!forwardedFor && realIp ? { "X-Forwarded-For": realIp } : {}),
        },
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
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
