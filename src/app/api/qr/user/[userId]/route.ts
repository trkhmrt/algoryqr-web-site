import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { GATEWAY_BASE } from "@/lib/config";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

export async function GET(_req: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await context.params;
    const cookieStore = await cookies();
    const accessToken = readAccessTokenFromCookies(cookieStore);

    if (!accessToken) {
      return NextResponse.json({ message: "Access token yok" }, { status: 401 });
    }

    const upstream = await axios.get(`${GATEWAY_BASE}/qr/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      validateStatus: () => true,
      timeout: 20_000,
    });

    return NextResponse.json(upstream.data ?? [], { status: upstream.status });
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
