import axios, { AxiosError } from "axios";
import { NextResponse } from "next/server";

import { API_BASE_URL } from "@/lib/config";

export async function GET(_req: Request, context: { params: Promise<{ identifier: string }> }) {
  try {
    const { identifier } = await context.params;
    if (!/^\d+$/.test(identifier)) {
      return NextResponse.json({ message: "Menü bulunamadı" }, { status: 404 });
    }

    const upstream = await axios.get(`${API_BASE_URL}/menu/public/id/${identifier}`, {
      validateStatus: () => true,
      timeout: 20_000,
    });

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
