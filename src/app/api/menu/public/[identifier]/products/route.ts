import { NextResponse } from "next/server";

import {
  publicMenuCachedJson,
  readPublicMenuUpstreamJson,
  searchParamsFromRequest,
} from "@/lib/public-menu-server-cache";

export async function GET(req: Request, context: { params: Promise<{ identifier: string }> }) {
  try {
    const { identifier } = await context.params;
    const params = searchParamsFromRequest(req);
    const { upstream, data } = await readPublicMenuUpstreamJson(
      `/menu/public/${identifier}/products`,
      params,
    );
    return publicMenuCachedJson(data, upstream.status);
  } catch (error) {
    return NextResponse.json({ message: "Sunucu hatası", detail: String(error) }, { status: 500 });
  }
}
