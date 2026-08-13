import axios from "axios";
import { NextResponse } from "next/server";

import { getUserIdFromAccessToken } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import { setCustomerAuthCookies } from "@/lib/server/customer-auth-cookies";

type LoginBody = {
  email?: string;
  password?: string;
  menuId?: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LoginBody;
    const loginPayload = {
      email: typeof body?.email === "string" ? body.email.trim() : "",
      password: typeof body?.password === "string" ? body.password : "",
      ...(typeof body?.menuId === "number" && body.menuId > 0 ? { menuId: body.menuId } : {}),
    };

    if (!loginPayload.email || !loginPayload.password) {
      return NextResponse.json({ message: "E-posta ve şifre gerekli" }, { status: 400 });
    }

    const upstream = await axios.post<Record<string, unknown>>(
      `${API_BASE_URL}/customer/auth/login`,
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
      customerId?: number;
    };

    if (upstream.status < 200 || upstream.status >= 300) {
      return NextResponse.json(
        { message: typeof data?.message === "string" ? data.message : "Giriş başarısız" },
        { status: upstream.status || 401 },
      );
    }

    const accessToken = data.accessToken;
    const refreshToken = data.refreshToken;
    const customerId =
      typeof data.customerId === "number"
        ? data.customerId
        : getUserIdFromAccessToken(typeof accessToken === "string" ? accessToken : undefined) ??
          undefined;

    const response = NextResponse.json({ ...data, customerId }, { status: 200 });
    setCustomerAuthCookies(
      response,
      typeof accessToken === "string" ? accessToken : undefined,
      typeof refreshToken === "string" ? refreshToken : undefined,
      customerId,
    );
    return response;
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
