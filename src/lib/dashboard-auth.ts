import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getUserFromAccessToken, type AuthUser } from "@/lib/auth-user";

export async function requireDashboardUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get("accessToken")?.value?.trim() ||
    cookieStore.get("algory_access_token")?.value?.trim() ||
    null;
  const refreshToken =
    cookieStore.get("refreshToken")?.value?.trim() ||
    cookieStore.get("algory_refresh_token")?.value?.trim() ||
    null;

  if (!accessToken && !refreshToken) {
    redirect("/login");
  }

  return getUserFromAccessToken(accessToken);
}
