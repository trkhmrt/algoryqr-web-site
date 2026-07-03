import axios from "axios";
import { NextResponse } from "next/server";

import { getAuthUpstreamUrl } from "@/lib/config";
import { messageFromRegisterUpstream } from "@/lib/register-upstream-error";

type RegisterBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  password?: string;
  passwordConfirm?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterBody;
    const registerPayload = {
      firstName: typeof body?.firstName === "string" ? body.firstName.trim() : "",
      lastName: typeof body?.lastName === "string" ? body.lastName.trim() : "",
      email: typeof body?.email === "string" ? body.email.trim() : "",
      phone: (typeof body?.phone === "string" ? body.phone : body?.phoneNumber ?? "").trim(),
      password: typeof body?.password === "string" ? body.password : "",
      passwordConfirm:
        typeof body?.passwordConfirm === "string" ? body.passwordConfirm : body?.password ?? "",
    };

    if (
      !registerPayload.firstName ||
      !registerPayload.lastName ||
      !registerPayload.email ||
      !registerPayload.phone ||
      !registerPayload.password
    ) {
      return NextResponse.json({ message: "Tüm alanlar gerekli" }, { status: 400 });
    }

    if (registerPayload.password !== registerPayload.passwordConfirm) {
      return NextResponse.json({ message: "Şifreler eşleşmiyor" }, { status: 400 });
    }

    const upstream = await axios.post<Record<string, unknown>>(
      `${getAuthUpstreamUrl()}/auth/register`,
      registerPayload,
      {
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        validateStatus: () => true,
        timeout: 20_000,
      },
    );

    const raw = upstream.data;
    const data = (typeof raw === "object" && raw != null ? raw : {}) as {
      message?: string;
      userId?: number;
      email?: string;
      firstName?: string;
      lastName?: string;
    };

    if (upstream.status < 200 || upstream.status >= 300) {
      const rawStr =
        typeof raw === "string" ? raw : JSON.stringify(raw ?? {});
      const message = messageFromRegisterUpstream(rawStr, upstream.status);
      return NextResponse.json({ message }, { status: upstream.status || 400 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sunucu hatası";
    return NextResponse.json({ message: "Kayıt sırasında hata: " + message }, { status: 500 });
  }
}
