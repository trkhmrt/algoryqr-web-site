export type ChefChatBadgeFilter =
  | { type: "chefRecommended" }
  | { type: "popularByRating" }
  | { type: "tagSlug"; slug: string };

export type ChefChatBadge = {
  id: string;
  label: string;
  filter: ChefChatBadgeFilter;
};

export const DEFAULT_CHEF_CHAT_BADGES: ChefChatBadge[] = [
  {
    id: "chef_recommended",
    label: "Şefin önerisi",
    filter: { type: "chefRecommended" },
  },
  {
    id: "popular",
    label: "En popüler",
    filter: { type: "popularByRating" },
  },
];

export function getChefChatBadgesForMenu(_publicId: string): ChefChatBadge[] {
  return DEFAULT_CHEF_CHAT_BADGES;
}
