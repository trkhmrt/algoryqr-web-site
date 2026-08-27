import axios from "axios";

import type { MenuProductApiItem } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";

type ProductPageResponse = {
  content?: MenuProductApiItem[];
  last?: boolean;
  totalPages?: number;
};

const PAGE_SIZE = 100;
const MAX_PAGES = 10;

export async function fetchPublicMenuProducts(
  menuId: number,
  params: Record<string, string | number | boolean> = {},
): Promise<MenuProductApiItem[]> {
  const upstream = await axios.get<ProductPageResponse>(
    `${API_BASE_URL}/menu/public/${menuId}/products`,
    {
      params,
      validateStatus: () => true,
      timeout: 20_000,
    },
  );

  if (upstream.status >= 400) {
    throw new Error(
      typeof upstream.data === "object" &&
        upstream.data &&
        "message" in upstream.data
        ? String((upstream.data as { message?: string }).message)
        : "Ürünler alınamadı",
    );
  }

  return Array.isArray(upstream.data?.content) ? upstream.data.content : [];
}

export async function fetchPublicMenuCatalog(menuId: number): Promise<MenuProductApiItem[]> {
  const products: MenuProductApiItem[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const batch = await fetchPublicMenuProducts(menuId, {
      page,
      size: PAGE_SIZE,
    });
    products.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }
  return products;
}
