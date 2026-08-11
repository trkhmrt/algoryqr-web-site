export type MenuCreateProfile = {
  businessName: string;
  slogan?: string;
  phone?: string;
  email?: string;
  address?: string;
  themeId: string;
  chefName?: string;
  chefAvatarKey?: string;
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
    chefName: menu.chefName,
    chefAvatarKey: menu.chefAvatarKey,
    products,
  };
}
