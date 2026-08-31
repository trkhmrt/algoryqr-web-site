import axios, { AxiosError } from "axios";
import { NextResponse } from "next/server";

import { API_BASE_URL } from "@/lib/config";

export async function GET(req: Request, context: { params: Promise<{ identifier: string }> }) {
  try {
    const { identifier } = await context.params;
    const url = new URL(req.url);
    const params: Record<string, string | string[]> = {};
    url.searchParams.forEach((value, key) => {
      const existing = params[key];
      if (existing == null) {
        params[key] = value;
        return;
      }
      if (Array.isArray(existing)) {
        existing.push(value);
        return;
      }
      params[key] = [existing, value];
    });

    const upstream = await axios.get(`${API_BASE_URL}/menu/public/${identifier}/categories`, {
      params,
      paramsSerializer: {
        indexes: null,
      },
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
