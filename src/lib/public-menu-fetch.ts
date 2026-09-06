import type { PublicMenuApiResponse } from "@/lib/api";
import { buildPublicMenuUpstreamUrl } from "@/lib/public-menu-server-cache";
import { permanentRedirect } from "next/navigation";
import { publicMenuContentPath } from "@/lib/public-menu-paths";

const MENU_OWNER_PACKAGE_INACTIVE = "MENU_OWNER_PACKAGE_INACTIVE";

export type PublicMenuFetchResult =
  | { status: "ok"; data: PublicMenuApiResponse; publicId: string }
  | { status: "package_inactive" }
  | { status: "not_found" };

async function resolveLegacyQrPublicId(qrId: string): Promise<string | null> {
  try {
    const response = await fetch(
      buildPublicMenuUpstreamUrl(`/menu/public/legacy-qr/${qrId}/public-id`),
      { cache: "no-store" },
    );
    if (!response.ok) {
      return null;
    }
    const body = (await response.json()) as { publicId?: string };
    return body.publicId?.trim() || null;
  } catch {
    return null;
  }
}

export async function fetchPublicMenu(identifier: string): Promise<PublicMenuFetchResult> {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return { status: "not_found" };
  }

  if (/^\d+$/.test(trimmed)) {
    const publicId = await resolveLegacyQrPublicId(trimmed);
    if (!publicId) {
      return { status: "not_found" };
    }
    permanentRedirect(publicMenuContentPath(publicId));
  }

  try {
    const response = await fetch(buildPublicMenuUpstreamUrl(`/menu/public/${encodeURIComponent(trimmed)}`), {
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
    const publicId = data.menu?.publicId?.trim() || trimmed;
    return { status: "ok", data, publicId };
  } catch {
    return { status: "not_found" };
  }
}
