import axios from "axios";
import { NextResponse } from "next/server";

import { getUserIdFromAccessToken } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import { setCustomerAuthCookies } from "@/lib/server/customer-auth-cookies";

type RegisterBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  publicId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterBody;
    const publicId = typeof body?.publicId === "string" ? body.publicId.trim() : "";
    const registerPayload = {
      firstName: typeof body?.firstName === "string" ? body.firstName.trim() : "",
      lastName: typeof body?.lastName === "string" ? body.lastName.trim() : "",
      email: typeof body?.email === "string" ? body.email.trim().toLowerCase() : "",
      password: typeof body?.password === "string" ? body.password : "",
      passwordConfirm:
        typeof body?.passwordConfirm === "string" ? body.passwordConfirm : body?.password ?? "",
      ...(publicId ? { publicId } : {}),
    };

    if (
      !registerPayload.firstName ||
      !registerPayload.email ||
      !registerPayload.password ||
      !registerPayload.passwordConfirm
    ) {
      return NextResponse.json({ message: "Zorunlu alanlar eksik" }, { status: 400 });
    }

    if (registerPayload.password !== registerPayload.passwordConfirm) {
      return NextResponse.json({ message: "Şifreler eşleşmiyor" }, { status: 400 });
    }

    const upstream = await axios.post<Record<string, unknown>>(
      `${API_BASE_URL}/customer/auth/register`,
      registerPayload,
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
        { message: typeof data?.message === "string" ? data.message : "Kayıt başarısız" },
        { status: upstream.status || 400 },
      );
    }

    const accessToken = data.accessToken;
    const refreshToken = data.refreshToken;
    const customerId =
      typeof data.customerId === "number"
        ? data.customerId
        : getUserIdFromAccessToken(typeof accessToken === "string" ? accessToken : undefined) ??
          undefined;

    const response = NextResponse.json({ ...data, customerId }, { status: upstream.status || 201 });
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
