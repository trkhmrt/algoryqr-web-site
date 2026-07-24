import axios from "axios";
import { cookies } from "next/headers";

import Index from "@/views/Index";
import type { PlanPackageApiItem } from "@/lib/api";
import { getUserFromAccessToken } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";

async function fetchPublicPackages(): Promise<PlanPackageApiItem[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/packages`, {
      validateStatus: () => true,
      timeout: 15_000,
    });
    if (response.status >= 200 && response.status < 300 && Array.isArray(response.data)) {
      return response.data as PlanPackageApiItem[];
    }
  } catch {
    /* empty */
  }
  return [];
}

export default async function Home() {
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get("accessToken")?.value?.trim() ||
    cookieStore.get("algory_access_token")?.value?.trim() ||
    null;
  const initialUser = getUserFromAccessToken(accessToken);
  const packages = await fetchPublicPackages();

  return <Index initialUser={initialUser} packages={packages} />;
}
