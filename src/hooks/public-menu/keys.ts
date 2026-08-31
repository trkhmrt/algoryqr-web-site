export const publicMenuKeys = {
  all: ["public-menu"] as const,
  categories: (menuId: number) => [...publicMenuKeys.all, "categories", menuId] as const,
  products: (menuId: number) => [...publicMenuKeys.all, "products", menuId] as const,
  categoryStats: (menuId: number, mainCategoryId: number) =>
    [...publicMenuKeys.all, "category-stats", menuId, mainCategoryId] as const,
  categoryCover: (menuId: number, mainCategoryId: number) =>
    [...publicMenuKeys.all, "category-cover", menuId, mainCategoryId] as const,
};
