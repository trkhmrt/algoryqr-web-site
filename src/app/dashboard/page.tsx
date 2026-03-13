import Dashboard from "@/views/Dashboard";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromAccessToken } from "@/lib/auth-user";

export default async function DashboardRoute() {
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get("algory_access_token")?.value ||
    cookieStore.get("accessToken")?.value ||
    null;
  const refreshToken =
    cookieStore.get("algory_refresh_token")?.value ||
    cookieStore.get("refreshToken")?.value ||
    null;

  if (!accessToken && !refreshToken) {
    redirect("/login");
  }

  const initialUser = getUserFromAccessToken(accessToken);
  return <Dashboard initialUser={initialUser} />;
}
