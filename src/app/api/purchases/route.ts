import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_BASE_URL } from "@/lib/config";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = readAccessTokenFromCookies(cookieStore);

    if (!accessToken) {
      return NextResponse.json({ message: "Access token yok" }, { status: 401 });
    }

    const body = (await req.json()) as {
      packageId?: number;
      paymentMode?: "DIRECT" | "THREE_DS";
      billingPeriod?: "MONTHLY" | "YEARLY";
      paymentStyle?: "SUBSCRIPTION";
      billingAddressId?: number;
      paymentMethodId?: number;
      recurringConsent?: boolean;
    };
    if (body.packageId == null) {
      return NextResponse.json({ message: "Paket id zorunludur" }, { status: 400 });
    }

    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const upstream = await axios.post(`${API_BASE_URL}/purchases`, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
        ...(!forwardedFor && realIp ? { "X-Forwarded-For": realIp } : {}),
      },
      validateStatus: () => true,
      timeout: 20_000,
    });

    return NextResponse.json(upstream.data ?? {}, { status: upstream.status });
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.code === "ECONNABORTED") {
        return NextResponse.json({ message: "Gateway timeout" }, { status: 504 });
      }
      if (error.response) {
        return NextResponse.json(error.response.data ?? {}, { status: error.response.status });
      }
    }
    return NextResponse.json({ message: "Sunucu hatası", detail: String(error) }, { status: 500 });
  }
}
