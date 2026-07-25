import type { MenuProductApiItem } from "@/lib/api";

export function searchMenuProducts(
  products: MenuProductApiItem[],
  query: string,
): MenuProductApiItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter((product) => {
    const name = product.name?.toLowerCase() ?? "";
    const description = product.description?.toLowerCase() ?? "";
    return name.includes(q) || description.includes(q);
  });
}
