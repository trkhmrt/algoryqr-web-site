import axios, { AxiosError } from "axios";
import { NextResponse } from "next/server";
import { z } from "zod";

import { parseChefQuery } from "@/lib/chef/parse-chef-query";
import type { ChefProductItem } from "@/lib/chef/parse-chef-query";
import { QR_MCP_API_KEY, QR_MCP_BASE_URL } from "@/lib/config";

const bodySchema = z.object({
  menuId: z.number().int().positive(),
  message: z.string().trim().min(1).max(500),
});

type McpSearchReport = {
  output?: {
    items?: ChefProductItem[];
  };
};

export async function POST(req: Request) {
  try {
    if (!QR_MCP_API_KEY) {
      return NextResponse.json(
        { message: "QR_MCP_API_KEY is not configured" },
        { status: 503 },
      );
    }

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const filters = parseChefQuery(parsed.data.menuId, parsed.data.message);

    const upstream = await axios.post<McpSearchReport>(
      `${QR_MCP_BASE_URL}/api/v1/products/search`,
      filters,
      {
        headers: {
          Authorization: `Bearer ${QR_MCP_API_KEY}`,
          "Content-Type": "application/json",
        },
        validateStatus: () => true,
        timeout: 20_000,
      },
    );

    if (upstream.status >= 400) {
      return NextResponse.json(upstream.data ?? { message: "Upstream error" }, {
        status: upstream.status,
      });
    }

    const items = upstream.data?.output?.items ?? [];
    return NextResponse.json({ items });
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
