import type { PublicMenuApiResponse } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import axios from "axios";

const MENU_OWNER_PACKAGE_INACTIVE = "MENU_OWNER_PACKAGE_INACTIVE";

export type PublicMenuFetchResult =
  | { status: "ok"; data: PublicMenuApiResponse }
  | { status: "package_inactive" }
  | { status: "not_found" };

export async function fetchPublicMenu(identifier: string): Promise<PublicMenuFetchResult> {
  if (!/^\d+$/.test(identifier)) {
    return { status: "not_found" };
  }

  const path = `${API_BASE_URL}/menu/public/id/${identifier}`;

  try {
    const response = await axios.get<PublicMenuApiResponse>(path, { timeout: 15_000 });
    return { status: "ok", data: response.data };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      const code = (error.response.data as { code?: string } | undefined)?.code;
      if (code === MENU_OWNER_PACKAGE_INACTIVE || code == null) {
        return { status: "package_inactive" };
      }
    }
    return { status: "not_found" };
  }
}
