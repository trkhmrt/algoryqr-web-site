import { NextResponse } from "next/server";

import {
  publicMenuCachedJson,
  readPublicMenuUpstreamJson,
} from "@/lib/public-menu-server-cache";

export async function GET(_req: Request, context: { params: Promise<{ identifier: string }> }) {
  try {
    const { identifier } = await context.params;
    const trimmed = identifier?.trim() ?? "";
    if (!trimmed || trimmed.includes("/")) {
      return NextResponse.json({ message: "Menü bulunamadı" }, { status: 404 });
    }

    const { upstream, data } = await readPublicMenuUpstreamJson(
      `/menu/public/${encodeURIComponent(trimmed)}`,
    );
    return publicMenuCachedJson(data, upstream.status);
  } catch (error) {
    return NextResponse.json({ message: "Sunucu hatası", detail: String(error) }, { status: 500 });
  }
}
