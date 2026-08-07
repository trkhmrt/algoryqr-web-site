import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { AI_SERVICE_API_KEY, AI_SERVICE_BASE_URL } from "@/lib/config";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

const bodySchema = z.object({
  product: z.record(z.string(), z.unknown()),
  locale: z.string().trim().min(2).max(16).optional(),
  options: z
    .object({
      tone: z.string().optional(),
      maxLength: z.string().optional(),
    })
    .optional(),
});

type UpstreamResponse = {
  description?: string;
  model?: string;
  promptVersion?: string;
  message?: string;
  detail?: string;
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = readAccessTokenFromCookies(cookieStore);
    if (!accessToken) {
      return NextResponse.json({ message: "Oturum gerekli" }, { status: 401 });
    }

    if (!AI_SERVICE_API_KEY) {
      return NextResponse.json(
        { message: "AI servisi yapılandırılmamış" },
        { status: 503 },
      );
    }

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const product = parsed.data.product;
    const name = typeof product.name === "string" ? product.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { message: "Ürün adı zorunludur" },
        { status: 400 },
      );
    }

    const upstream = await axios.post<UpstreamResponse>(
      `${AI_SERVICE_BASE_URL}/api/v1/product-descriptions`,
      {
        product,
        locale: parsed.data.locale ?? "tr",
        options: parsed.data.options ?? undefined,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-API-Key": AI_SERVICE_API_KEY,
        },
        validateStatus: () => true,
        timeout: 60_000,
      },
    );

    if (upstream.status >= 400) {
      const message =
        upstream.data?.message ||
        upstream.data?.detail ||
        "Akıllı özet üretilemedi";
      return NextResponse.json(
        { message },
        { status: upstream.status >= 500 ? 502 : upstream.status },
      );
    }

    const description = (upstream.data?.description ?? "").trim();
    if (!description) {
      return NextResponse.json(
        { message: "AI boş açıklama döndü" },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        description,
        model: upstream.data?.model ?? null,
        promptVersion:
          upstream.data?.promptVersion ??
          (upstream.data as { prompt_version?: string } | undefined)?.prompt_version ??
          null,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.code === "ECONNABORTED") {
        return NextResponse.json({ message: "Gateway timeout" }, { status: 504 });
      }
      if (error.response) {
        return NextResponse.json(
          {
            message:
              (error.response.data as { message?: string; detail?: string } | undefined)
                ?.message ||
              (error.response.data as { detail?: string } | undefined)?.detail ||
              "Upstream error",
          },
          { status: error.response.status >= 500 ? 502 : error.response.status },
        );
      }
    }
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
