export const publicMenuKeys = {
  all: ["public-menu"] as const,
  categories: (publicId: string) => [...publicMenuKeys.all, "categories", publicId] as const,
  products: (publicId: string) => [...publicMenuKeys.all, "products", publicId] as const,
  categoryStats: (publicId: string, mainCategoryId: number) =>
    [...publicMenuKeys.all, "category-stats", publicId, mainCategoryId] as const,
  categoryCover: (publicId: string, mainCategoryId: number) =>
    [...publicMenuKeys.all, "category-cover", publicId, mainCategoryId] as const,
};
