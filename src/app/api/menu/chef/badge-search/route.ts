import { NextResponse } from "next/server";
import { z } from "zod";

import type { MenuProductApiItem } from "@/lib/api";
import { DEFAULT_CHEF_CHAT_BADGES, type ChefChatBadgeFilter } from "@/lib/chef/chef-chat-badges";
import { fetchPublicMenuProducts } from "@/lib/chef/fetch-public-menu-products";
import { mapMenuProductToChefItem } from "@/lib/chef/map-menu-product-to-chef-item";
import { normalizeChefProducts } from "@/lib/chef/normalize-chef-products";

const MAX_PRODUCTS = 10;

const bodySchema = z.object({
  menuId: z.number().int().positive(),
  badgeId: z.string().trim().min(1).max(64),
});

function resolveBadgeFilter(badgeId: string): ChefChatBadgeFilter | null {
  const badge = DEFAULT_CHEF_CHAT_BADGES.find((entry) => entry.id === badgeId);
  return badge?.filter ?? null;
}

function ratingScore(product: MenuProductApiItem): number {
  const avg =
    typeof product.ratingAvg === "number"
      ? product.ratingAvg
      : Number(product.ratingAvg ?? 0);
  const count =
    typeof product.ratingCount === "number"
      ? product.ratingCount
      : Number(product.ratingCount ?? 0);
  if (!Number.isFinite(avg) || !Number.isFinite(count)) return 0;
  return avg * 1000 + count;
}

function buildReply(badgeId: string, count: number): string {
  if (badgeId === "chef_recommended") {
    return count > 0
      ? `Şefin önerisi ${count} ürünü kartlarda gösteriyorum.`
      : "Şefin önerisi için uygun ürün bulamadım.";
  }
  if (badgeId === "popular") {
    return count > 0
      ? `En popüler ${count} ürünü kartlarda gösteriyorum.`
      : "En popüler ürünler için sonuç bulamadım.";
  }
  return count > 0
    ? `${count} ürünü kartlarda gösteriyorum.`
    : "Bu filtre için uygun ürün bulamadım.";
}

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const filter = resolveBadgeFilter(parsed.data.badgeId);
    if (!filter) {
      return NextResponse.json({ message: "Badge bulunamadı" }, { status: 404 });
    }

    const { menuId, badgeId } = parsed.data;
    let products: MenuProductApiItem[] = [];

    if (filter.type === "chefRecommended") {
      products = await fetchPublicMenuProducts(menuId, {
        page: 0,
        size: MAX_PRODUCTS,
        chefRecommended: true,
      });
    } else if (filter.type === "tagSlug") {
      products = await fetchPublicMenuProducts(menuId, {
        page: 0,
        size: MAX_PRODUCTS,
        tagSlug: filter.slug,
      });
    } else {
      const fetched = await fetchPublicMenuProducts(menuId, {
        page: 0,
        size: 50,
      });
      products = [...fetched]
        .sort((left, right) => ratingScore(right) - ratingScore(left))
        .slice(0, MAX_PRODUCTS);
    }

    const mapped = normalizeChefProducts(
      products.map((product) => mapMenuProductToChefItem(product)),
    );

    return NextResponse.json({
      reply: buildReply(badgeId, mapped.length),
      products: mapped,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Sunucu hatası" },
      { status: 502 },
    );
  }
}
