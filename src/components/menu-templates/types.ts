import type { MenuVisitAnalytics } from "@/hooks/use-menu-visit-analytics";
import type { MenuCategoryApiItem, MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";

export type MenuTemplateProps = {
  menu: MenuProfileApiItem;
  products: MenuProductApiItem[];
  categories?: MenuCategoryApiItem[];
  analytics?: MenuVisitAnalytics;
};

export type MenuNavCategory = {
  key: string;
  categoryId: number | null;
  name: string;
  depth: number;
};

export function flattenNavCategories(
  categories: MenuCategoryApiItem[],
  depth = 0,
): MenuNavCategory[] {
  return categories.flatMap((category) => [
    {
      key: `cat-${category.categoryId}`,
      categoryId: category.categoryId,
      name: category.name,
      depth,
    },
    ...flattenNavCategories(category.children ?? [], depth + 1),
  ]);
}

export function resolveMenuNavCategories(
  categories: MenuCategoryApiItem[] | undefined,
  products: MenuProductApiItem[],
): MenuNavCategory[] {
  const fromApi = flattenNavCategories(categories ?? []);
  if (fromApi.length > 0) return fromApi;

  const seen = new Set<string>();
  const fromProducts: MenuNavCategory[] = [];
  for (const product of products) {
    const name =
      product.categoryPath?.trim() ||
      product.categoryName?.trim() ||
      product.category?.trim() ||
      "Genel";
    if (seen.has(name)) continue;
    seen.add(name);
    fromProducts.push({
      key: `name-${name.toLowerCase()}`,
      categoryId: product.categoryId ?? null,
      name,
      depth: 0,
    });
  }
  return fromProducts;
}

export function filterProductsByNavCategory(
  products: MenuProductApiItem[],
  category: MenuNavCategory | null,
): MenuProductApiItem[] {
  if (!category) return products;
  if (category.categoryId != null) {
    return products.filter((product) => product.categoryId === category.categoryId);
  }
  const name = category.name.trim().toLowerCase();
  return products.filter((product) => {
    const labels = [product.categoryPath, product.categoryName, product.category]
      .map((value) => value?.trim().toLowerCase())
      .filter(Boolean);
    return labels.includes(name) || (name === "genel" && labels.length === 0);
  });
}

export function groupProductsByCategory(products: MenuProductApiItem[]) {
  const groups = new Map<string, MenuProductApiItem[]>();
  for (const product of products) {
    const key =
      product.categoryPath?.trim() ||
      product.categoryName?.trim() ||
      product.category?.trim() ||
      "Genel";
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
