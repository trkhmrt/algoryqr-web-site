import axios from "axios";
import { NextResponse } from "next/server";

import { API_BASE_URL } from "@/lib/config";
import { setWaiterAuthCookies } from "@/lib/server/waiter-auth-cookies";

type LoginBody = {
  username?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LoginBody;
    const loginPayload = {
      username: typeof body?.username === "string" ? body.username.trim() : "",
      password: typeof body?.password === "string" ? body.password : "",
    };

    if (!loginPayload.username || !loginPayload.password) {
      return NextResponse.json({ message: "Kullanıcı adı ve şifre gerekli" }, { status: 400 });
    }

    const upstream = await axios.post<Record<string, unknown>>(
      `${API_BASE_URL}/waiter/auth/login`,
      loginPayload,
      {
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        validateStatus: () => true,
        timeout: 20_000,
      },
    );

    const data = (typeof upstream.data === "object" && upstream.data != null
      ? upstream.data
      : {}) as {
      message?: string;
      accessToken?: string;
      refreshToken?: string;
      waiterId?: number;
      menuId?: number;
      displayName?: string;
    };

    if (upstream.status < 200 || upstream.status >= 300) {
      return NextResponse.json(
        { message: typeof data?.message === "string" ? data.message : "Giriş başarısız" },
        { status: upstream.status || 401 },
      );
    }

    const accessToken = data.accessToken;
    const refreshToken = data.refreshToken;
    const waiterId = typeof data.waiterId === "number" ? data.waiterId : undefined;

    const response = NextResponse.json(
      {
        accessToken,
        refreshToken,
        waiterId,
        menuId: data.menuId,
        displayName: data.displayName,
      },
      { status: 200 },
    );
    setWaiterAuthCookies(
      response,
      typeof accessToken === "string" ? accessToken : undefined,
      typeof refreshToken === "string" ? refreshToken : undefined,
      waiterId,
    );
    return response;
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
