import axios, { AxiosError } from "axios";
import { NextResponse } from "next/server";

import { API_BASE_URL } from "@/lib/config";

export async function GET(req: Request) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const page = searchParams.get("page") ?? "0";
    const size = searchParams.get("size") ?? "5";
    const q = searchParams.get("q") ?? undefined;

    const upstream = await axios.get(`${API_BASE_URL}/menu/taxonomy/page`, {
      params: { page, size, ...(q ? { q } : {}) },
      validateStatus: () => true,
      timeout: 20_000,
    });
    return NextResponse.json(
      upstream.data ?? {
        content: [],
        page: 0,
        size: 5,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
      },
      { status: upstream.status },
    );
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
