import { NextResponse } from "next/server";

import {
  PUBLIC_MENU_REVALIDATE_SECONDS,
  publicMenuCachedJson,
  readPublicMenuUpstreamJson,
} from "@/lib/public-menu-server-cache";

export const revalidate = PUBLIC_MENU_REVALIDATE_SECONDS;

export async function GET(_req: Request, context: { params: Promise<{ identifier: string }> }) {
  try {
    const { identifier } = await context.params;
    if (!/^\d+$/.test(identifier)) {
      return NextResponse.json({ message: "Menü bulunamadı" }, { status: 404 });
    }

    const { upstream, data } = await readPublicMenuUpstreamJson(`/menu/public/id/${identifier}`);
    return publicMenuCachedJson(data, upstream.status);
  } catch (error) {
    return NextResponse.json({ message: "Sunucu hatası", detail: String(error) }, { status: 500 });
  }
}
