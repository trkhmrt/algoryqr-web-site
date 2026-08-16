import axios, { AxiosError } from "axios";
import { NextResponse } from "next/server";

import { API_BASE_URL } from "@/lib/config";
import { clientContextHeaders } from "@/lib/server/client-headers";

export async function POST(request: Request) {
  try {
    const body = await request.text();

    const upstream = await axios.post(
      `${API_BASE_URL}/analytics/site/visit`,
      body ? JSON.parse(body) : {},
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...clientContextHeaders(request),
        },
        validateStatus: () => true,
        timeout: 10_000,
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
