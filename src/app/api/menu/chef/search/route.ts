import axios, { AxiosError } from "axios";
import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeChefProducts } from "@/lib/chef/normalize-chef-products";
import { reconcileChefProductsWithMenuCatalog } from "@/lib/chef/reconcile-chef-products";
import { QR_AGENT_BASE_URL } from "@/lib/config";

const bodySchema = z.object({
  menuId: z.number().int().positive(),
  message: z.string().trim().min(1).max(1000),
  conversationId: z.string().trim().min(1).max(100).optional(),
});

type ChatTiming = {
  path: "agent";
  totalMs: number;
  moderationMs: number;
  agentMs?: number;
  mcpConnectMs?: number;
  searchMs?: number;
};

type AgentChatResponse = {
  reply?: string;
  conversationId?: string;
  message?: string;
  products?: unknown;
  timing?: ChatTiming;
};

export async function POST(req: Request) {
  const bffStarted = performance.now();

  try {
    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const upstream = await axios.post<AgentChatResponse>(
      `${QR_AGENT_BASE_URL}/api/v1/chat`,
      {
        menuId: parsed.data.menuId,
        message: parsed.data.message,
        conversationId: parsed.data.conversationId,
      },
      {
        headers: { "Content-Type": "application/json" },
        validateStatus: () => true,
        timeout: 60_000,
      },
    );

    if (upstream.status >= 400) {
      const message =
        upstream.data?.message ||
        (typeof upstream.data === "string" ? upstream.data : "") ||
        "Agent error";
      return NextResponse.json(
        { message },
        { status: upstream.status >= 500 ? 502 : upstream.status },
      );
    }

    const normalized = normalizeChefProducts(upstream.data.products);
    let products = normalized;
    try {
      products = await reconcileChefProductsWithMenuCatalog(
        parsed.data.menuId,
        normalized,
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "chef_product_reconcile_failed",
          menuId: parsed.data.menuId,
          message: error instanceof Error ? error.message : String(error),
        }),
      );
    }

    const bffMs = Math.round(performance.now() - bffStarted);
    const timing = upstream.data.timing
      ? { ...upstream.data.timing, bffMs }
      : undefined;

    if (timing) {
      console.error(
        JSON.stringify({
          event: "chef_bff_timing",
          menuId: parsed.data.menuId,
          conversationId: upstream.data.conversationId,
          agentProductCount: normalized.length,
          reconciledProductCount: products.length,
          ...timing,
        }),
      );
    }

    return NextResponse.json({
      reply: upstream.data.reply ?? "",
      conversationId: upstream.data.conversationId,
      products,
      timing,
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
    return NextResponse.json({ message: "Sunucu hatası", detail: String(error) }, { status: 500 });
  }
}
