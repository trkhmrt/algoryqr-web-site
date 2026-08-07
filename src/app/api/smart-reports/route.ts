import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getUserIdFromAccessToken } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

const bodySchema = z.object({
  menuId: z.number().int().positive(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  locale: z.string().trim().min(2).max(16).optional(),
  options: z
    .object({
      tone: z.string().optional(),
      maxLength: z.number().int().positive().optional(),
      focusAreas: z.array(z.string()).optional(),
    })
    .optional(),
});

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = readAccessTokenFromCookies(cookieStore);
    if (!accessToken) {
      return NextResponse.json({ message: "Oturum gerekli" }, { status: 401 });
    }

    const userId = getUserIdFromAccessToken(accessToken);
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") ?? "0";
    const size = searchParams.get("size") ?? "20";
    const sort = searchParams.get("sort") ?? "createdAt,desc";
    const status = searchParams.get("status") ?? "completed";

    const upstream = await axios.get(`${API_BASE_URL}/analytics/smart-reports`, {
      params: { page, size, sort, status },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        ...(userId != null ? { "X-User-Id": String(userId) } : {}),
      },
      validateStatus: () => true,
      timeout: 20_000,
    });

    if (upstream.status >= 400) {
      const message =
        (upstream.data as { message?: string } | undefined)?.message ||
        "Akilli rapor listesi alinamadi";
      return NextResponse.json(
        { message },
        { status: upstream.status >= 500 ? 502 : upstream.status },
      );
    }

    return NextResponse.json(upstream.data, { status: 200 });
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.code === "ECONNABORTED") {
        return NextResponse.json({ message: "Gateway timeout" }, { status: 504 });
      }
      if (error.response) {
        return NextResponse.json(
          {
            message:
              (error.response.data as { message?: string } | undefined)?.message ||
              "Upstream error",
          },
          { status: error.response.status >= 500 ? 502 : error.response.status },
        );
      }
    }
    return NextResponse.json({ message: "Sunucu hatasi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = readAccessTokenFromCookies(cookieStore);
    if (!accessToken) {
      return NextResponse.json({ message: "Oturum gerekli" }, { status: 401 });
    }

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { menuId, from, to, locale, options } = parsed.data;
    const userId = getUserIdFromAccessToken(accessToken);

    const upstream = await axios.post(
      `${API_BASE_URL}/analytics/menu/${menuId}/smart-reports`,
      {
        from,
        to,
        locale: locale ?? "tr",
        options: options ?? undefined,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(userId != null ? { "X-User-Id": String(userId) } : {}),
        },
        validateStatus: () => true,
        timeout: 30_000,
      },
    );

    if (upstream.status >= 400) {
      const message =
        (upstream.data as { message?: string; detail?: string } | undefined)?.message ||
        (upstream.data as { detail?: string } | undefined)?.detail ||
        "Smart report kuyruga alinamadi";
      return NextResponse.json(
        { message },
        { status: upstream.status >= 500 ? 502 : upstream.status },
      );
    }

    return NextResponse.json(upstream.data, {
      status: upstream.status === 202 ? 202 : 200,
    });
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.code === "ECONNABORTED") {
        return NextResponse.json({ message: "Gateway timeout" }, { status: 504 });
      }
      if (error.response) {
        return NextResponse.json(
          {
            message:
              (error.response.data as { message?: string } | undefined)?.message ||
              "Upstream error",
          },
          { status: error.response.status >= 500 ? 502 : error.response.status },
        );
      }
    }
    return NextResponse.json({ message: "Sunucu hatasi" }, { status: 500 });
  }
}
