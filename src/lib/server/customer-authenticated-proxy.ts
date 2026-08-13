import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getUserIdFromAccessToken } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import { readCustomerAccessTokenFromCookies } from "@/lib/server/customer-auth-cookies";

export async function proxyCustomerAuthenticatedRequest(
  request: Request,
  upstreamPath: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  options?: { requireAuth?: boolean },
) {
  try {
    const requireAuth = options?.requireAuth !== false;
    const cookieStore = await cookies();
    const accessToken = readCustomerAccessTokenFromCookies(cookieStore);
    if (requireAuth && !accessToken) {
      return NextResponse.json({ message: "Oturum gerekli" }, { status: 401 });
    }

    const customerId = accessToken ? getUserIdFromAccessToken(accessToken) : null;
    const requestUrl = new URL(request.url);
    const query = requestUrl.search;
    const text = method === "GET" || method === "DELETE" ? "" : await request.text();
    let data: unknown;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        return NextResponse.json({ message: "Geçersiz JSON" }, { status: 400 });
      }
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const tableSession = request.headers.get("x-table-session");

    const upstream = await axios.request({
      url: `${API_BASE_URL}${upstreamPath}${query}`,
      method,
      data,
      headers: {
        Accept: "application/json",
        ...(text ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(customerId != null ? { "X-User-Id": String(customerId) } : {}),
        ...(tableSession ? { "X-Table-Session": tableSession } : {}),
        ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
        ...(!forwardedFor && realIp ? { "X-Forwarded-For": realIp } : {}),
      },
      validateStatus: () => true,
      timeout: 20_000,
    });

    if (upstream.status === 204 || upstream.data == null || upstream.data === "") {
      return new NextResponse(null, { status: upstream.status });
    }
    return NextResponse.json(upstream.data, { status: upstream.status });
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.code === "ECONNABORTED") {
        return NextResponse.json({ message: "Gateway timeout" }, { status: 504 });
      }
      if (error.response) {
        return NextResponse.json(error.response.data ?? {}, { status: error.response.status });
      }
    }
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}

/** Public menu order endpoints: forward X-Table-Session (+ optional customer Bearer). */
export async function proxyPublicTableSessionRequest(
  request: Request,
  upstreamPath: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  options?: { requireTableSession?: boolean; forwardCustomerAuth?: boolean },
) {
  try {
    const requireTableSession = options?.requireTableSession !== false;
    const forwardCustomerAuth = options?.forwardCustomerAuth === true;
    const tableSession = request.headers.get("x-table-session")?.trim();
    if (requireTableSession && !tableSession) {
      return NextResponse.json({ message: "Masa oturumu gerekli" }, { status: 401 });
    }

    const cookieStore = await cookies();
    const accessToken = forwardCustomerAuth
      ? readCustomerAccessTokenFromCookies(cookieStore)
      : null;

    const requestUrl = new URL(request.url);
    const query = requestUrl.search;
    const text = method === "GET" || method === "DELETE" ? "" : await request.text();
    let data: unknown;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        return NextResponse.json({ message: "Geçersiz JSON" }, { status: 400 });
      }
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");

    const upstream = await axios.request({
      url: `${API_BASE_URL}${upstreamPath}${query}`,
      method,
      data,
      headers: {
        Accept: "application/json",
        ...(text ? { "Content-Type": "application/json" } : {}),
        ...(tableSession ? { "X-Table-Session": tableSession } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
        ...(!forwardedFor && realIp ? { "X-Forwarded-For": realIp } : {}),
      },
      validateStatus: () => true,
      timeout: 20_000,
    });

    if (upstream.status === 204 || upstream.data == null || upstream.data === "") {
      return new NextResponse(null, { status: upstream.status });
    }
    return NextResponse.json(upstream.data, { status: upstream.status });
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.code === "ECONNABORTED") {
        return NextResponse.json({ message: "Gateway timeout" }, { status: 504 });
      }
      if (error.response) {
        return NextResponse.json(error.response.data ?? {}, { status: error.response.status });
      }
    }
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
