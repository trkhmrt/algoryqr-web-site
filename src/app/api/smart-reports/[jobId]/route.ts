import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getUserIdFromAccessToken } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  try {
    const cookieStore = await cookies();
    const accessToken = readAccessTokenFromCookies(cookieStore);
    if (!accessToken) {
      return NextResponse.json({ message: "Oturum gerekli" }, { status: 401 });
    }

    const { jobId } = await context.params;
    if (!jobId || !/^[0-9a-fA-F-]{36}$/.test(jobId)) {
      return NextResponse.json({ message: "Gecersiz jobId" }, { status: 400 });
    }

    const userId = getUserIdFromAccessToken(accessToken);
    const upstream = await axios.get(`${API_BASE_URL}/analytics/smart-reports/${jobId}`, {
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
        (upstream.data as { message?: string; detail?: string } | undefined)?.message ||
        (upstream.data as { detail?: string } | undefined)?.detail ||
        "Akilli rapor alinamadi";
      return NextResponse.json(
        { message },
        { status: upstream.status >= 500 ? 502 : upstream.status },
      );
    }

    return NextResponse.json(upstream.data, { status: upstream.status });
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
