import Dashboard from "@/views/Dashboard";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromAccessToken } from "@/lib/auth-user";

export default async function DashboardRoute() {
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

  const initialUser = getUserFromAccessToken(accessToken);
  return <Dashboard initialUser={initialUser} />;
}
