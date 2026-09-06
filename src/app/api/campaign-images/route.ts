import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { AI_SERVICE_API_KEY, AI_SERVICE_BASE_URL } from "@/lib/config";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slogan: z.string().trim().max(255).optional(),
  productNames: z.array(z.string().trim().min(1)).max(8).default([]),
  productImageUrls: z.array(z.string().trim().min(1).max(2048)).max(4).default([]),
});

type UpstreamResponse = {
  imageBase64?: string;
  contentType?: string;
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

    const upstream = await axios.post<UpstreamResponse>(
      `${AI_SERVICE_BASE_URL}/api/v1/campaign-images`,
      {
        name: parsed.data.name,
        slogan: parsed.data.slogan,
        productNames: parsed.data.productNames,
        productImageUrls: parsed.data.productImageUrls,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-API-Key": AI_SERVICE_API_KEY,
        },
        validateStatus: () => true,
        timeout: 130_000,
      },
    );

    if (upstream.status >= 400) {
      const message =
        upstream.data?.message ||
        upstream.data?.detail ||
        "Kampanya görseli üretilemedi";
      return NextResponse.json(
        { message },
        { status: upstream.status >= 500 ? 502 : upstream.status },
      );
    }

    const imageBase64 = (upstream.data?.imageBase64 ?? "").trim();
    if (!imageBase64) {
      return NextResponse.json(
        { message: "AI boş görsel döndü" },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        imageBase64,
        contentType: upstream.data?.contentType ?? "image/png",
        model: upstream.data?.model ?? null,
        promptVersion: upstream.data?.promptVersion ?? null,
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
