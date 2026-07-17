export type MenuCreateProfile = {
  businessName: string;
  slogan?: string;
  phone?: string;
  email?: string;
  address?: string;
  themeId: string;
  urlMode: "id" | "slug";
  publicSlug?: string;
};

export type MenuCreateProduct = {
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  category?: string;
};

export function buildMenuCreateDetails(
  menu: MenuCreateProfile,
  products: MenuCreateProduct[] = [],
) {
  return {
    businessName: menu.businessName,
    slogan: menu.slogan,
    phone: menu.phone,
    email: menu.email,
    address: menu.address,
    themeId: menu.themeId,
    urlMode: menu.urlMode.toUpperCase(),
    ...(menu.urlMode === "slug" ? { publicSlug: menu.publicSlug } : {}),
    products,
  };
}
