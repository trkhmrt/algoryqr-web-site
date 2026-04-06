import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthUpstreamUrl } from "@/lib/config";

/** Backend refresh token'ı iptal eder; cookie adı refresh_token. */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken =
      cookieStore.get("algory_refresh_token")?.value ||
      cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json({ message: "Refresh token yok" }, { status: 401 });
    }

    const upstream = await fetch(`${getAuthUpstreamUrl()}/basicauth/revoke-refreshtoken`, {
      method: "POST",
      headers: { Cookie: `refresh_token=${refreshToken}` },
      cache: "no-store",
    });

    return NextResponse.json(
      upstream.ok ? { ok: true } : { message: "İptal başarısız" },
      { status: upstream.ok ? 200 : upstream.status || 400 },
    );
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
