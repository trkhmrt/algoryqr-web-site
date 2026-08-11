import type { ChefProductItem } from "@/lib/chef/parse-chef-query";

const MAX_PRODUCTS = 10;

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeItem(raw: unknown): ChefProductItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;

  const productId = asNumber(item.productId);
  const name = asString(item.name);
  if (productId == null || !name) return null;

  const menuId = asNumber(item.menuId) ?? 0;
  const price = asNumber(item.price);
  const subCategoryId = asNumber(item.subCategoryId);
  const description = asString(item.description);
  const imageUrl = asString(item.imageUrl);
  const currency = asString(item.currency) || "TRY";
  const subCategoryName = asString(item.subCategoryName);
  const mainCategoryName = asString(item.mainCategoryName);
  const available = typeof item.available === "boolean" ? item.available : true;

  let nutrition: Record<string, unknown> | null = null;
  if (item.nutrition && typeof item.nutrition === "object" && !Array.isArray(item.nutrition)) {
    nutrition = item.nutrition as Record<string, unknown>;
  }

  return {
    productId,
    menuId,
    name,
    description,
    subCategoryId,
    subCategoryName,
    mainCategoryName,
    price,
    currency,
    imageUrl,
    available,
    nutrition,
  };
}

export function normalizeChefProducts(raw: unknown): ChefProductItem[] {
  if (!Array.isArray(raw)) return [];
  const products: ChefProductItem[] = [];
  for (const entry of raw) {
    if (products.length >= MAX_PRODUCTS) break;
    const item = normalizeItem(entry);
    if (item) products.push(item);
  }
  return products;
}
