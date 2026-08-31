import { NextResponse } from "next/server";

import {
  PUBLIC_MENU_REVALIDATE_SECONDS,
  publicMenuCachedJson,
  readPublicMenuUpstreamJson,
  searchParamsFromRequest,
} from "@/lib/public-menu-server-cache";

export const revalidate = PUBLIC_MENU_REVALIDATE_SECONDS;

export async function GET(req: Request, context: { params: Promise<{ identifier: string }> }) {
  try {
    const { identifier } = await context.params;
    const params = searchParamsFromRequest(req);
    const { upstream, data } = await readPublicMenuUpstreamJson(
      `/menu/public/${identifier}/product-facets`,
      params,
    );
    return publicMenuCachedJson(data, upstream.status);
  } catch (error) {
    return NextResponse.json({ message: "Sunucu hatası", detail: String(error) }, { status: 500 });
  }
}
