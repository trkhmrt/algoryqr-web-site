import axios, { AxiosError } from "axios";
import { NextResponse } from "next/server";

import { API_BASE_URL } from "@/lib/config";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const excludeMenuId = searchParams.get("excludeMenuId");
    if (!slug) {
      return NextResponse.json({ message: "slug zorunlu" }, { status: 400 });
    }

    const params = new URLSearchParams({ slug });
    if (excludeMenuId) params.set("excludeMenuId", excludeMenuId);

    const upstream = await axios.get(`${API_BASE_URL}/menu/slug-available?${params.toString()}`, {
      validateStatus: () => true,
      timeout: 15_000,
    });

    return NextResponse.json(upstream.data ?? {}, { status: upstream.status });
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data ?? {}, { status: error.response.status });
    }
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
