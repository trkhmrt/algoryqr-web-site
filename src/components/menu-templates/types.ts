import type { MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";

export type MenuTemplateProps = {
  menu: MenuProfileApiItem;
  products: MenuProductApiItem[];
};

export function groupProductsByCategory(products: MenuProductApiItem[]) {
  const groups = new Map<string, MenuProductApiItem[]>();
  for (const product of products) {
    const key = product.category?.trim() || "Genel";
    const list = groups.get(key) ?? [];
    list.push(product);
    groups.set(key, list);
  }
  return Array.from(groups.entries());
}

export function formatMenuPrice(price?: number | string, currency = "TRY") {
  const amount = typeof price === "string" ? parseFloat(price) : price;
  if (amount == null || !Number.isFinite(amount)) return "";
  const symbol = currency === "TRY" || currency === "TL" ? "₺" : currency;
  return `${symbol}${amount.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
}
