import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildUpstreamAuthHeaders } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function proxy(req: Request, method: string, path: string[]) {
  const cookieStore = await cookies();
  const accessToken = readAccessTokenFromCookies(cookieStore);
  if (!accessToken) {
    return NextResponse.json({ message: "Access token yok" }, { status: 401 });
  }
  const suffix = path.length > 0 ? `/${path.join("/")}` : "";
  const url = `${API_BASE_URL}/branches${suffix}`;
  const contentType = req.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");
  const headers: Record<string, string> = {
    ...buildUpstreamAuthHeaders(accessToken),
    ...(req.headers.get("x-forwarded-for")
      ? { "X-Forwarded-For": req.headers.get("x-forwarded-for") as string }
      : {}),
  };
  let data: unknown = undefined;
  if (method !== "GET" && method !== "DELETE") {
    if (isMultipart) {
      data = Buffer.from(await req.arrayBuffer());
      headers["Content-Type"] = contentType;
    } else if (method !== "POST" || req.headers.get("content-length") !== "0") {
      const text = await req.text();
      data = text ? JSON.parse(text) : undefined;
      headers["Content-Type"] = "application/json";
    }
  }
  try {
    const upstream = await axios.request({
      url,
      method,
      data,
      headers,
      validateStatus: () => true,
      timeout: 20_000,
    });
    if (
      upstream.status === 204 ||
      upstream.status === 205 ||
      upstream.data == null ||
      upstream.data === ""
    ) {
      return new NextResponse(null, { status: upstream.status });
    }
    return NextResponse.json(upstream.data, { status: upstream.status });
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data ?? {}, { status: error.response.status });
    }
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}

export async function GET(req: Request, context: RouteContext) {
  return proxy(req, "GET", (await context.params).path ?? []);
}

export async function POST(req: Request, context: RouteContext) {
  return proxy(req, "POST", (await context.params).path ?? []);
}

export async function PUT(req: Request, context: RouteContext) {
  return proxy(req, "PUT", (await context.params).path ?? []);
}

export async function DELETE(req: Request, context: RouteContext) {
  return proxy(req, "DELETE", (await context.params).path ?? []);
}
