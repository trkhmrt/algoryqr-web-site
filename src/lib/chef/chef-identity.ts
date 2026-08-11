export const DEFAULT_CHEF_DISPLAY_NAME = "Akıllı Şef";
export const DEFAULT_CHEF_AVATAR_SRC = "/chef/chef-avatar.png";

export function resolveChefDisplayName(
  chefDisplayName?: string | null,
  chefName?: string | null,
): string {
  const display = chefDisplayName?.trim();
  if (display) return display;
  const custom = chefName?.trim();
  if (custom) return custom;
  return DEFAULT_CHEF_DISPLAY_NAME;
}

export function resolveChefAvatarSrc(chefAvatarUrl?: string | null): string {
  const url = chefAvatarUrl?.trim();
  return url || DEFAULT_CHEF_AVATAR_SRC;
}
