import type { PublicMenuApiResponse } from "@/lib/api";
import { buildPublicMenuUpstreamUrl } from "@/lib/public-menu-server-cache";

const MENU_OWNER_PACKAGE_INACTIVE = "MENU_OWNER_PACKAGE_INACTIVE";

export type PublicMenuFetchResult =
  | { status: "ok"; data: PublicMenuApiResponse }
  | { status: "package_inactive" }
  | { status: "not_found" };

export async function fetchPublicMenu(identifier: string): Promise<PublicMenuFetchResult> {
  if (!/^\d+$/.test(identifier)) {
    return { status: "not_found" };
  }

  try {
    // The menu profile includes the active theme. Do not serve a stale ISR
    // snapshot after the owner changes the theme in the dashboard.
    const response = await fetch(buildPublicMenuUpstreamUrl(`/menu/public/id/${identifier}`), {
      cache: "no-store",
    });

    if (response.status === 403) {
      const body = (await response.json().catch(() => ({}))) as { code?: string };
      if (body.code === MENU_OWNER_PACKAGE_INACTIVE || body.code == null) {
        return { status: "package_inactive" };
      }
      return { status: "not_found" };
    }

    if (!response.ok) {
      return { status: "not_found" };
    }

    const data = (await response.json()) as PublicMenuApiResponse;
    return { status: "ok", data };
  } catch {
    return { status: "not_found" };
  }
}
