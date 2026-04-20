import Index from "@/views/Index";
import { cookies } from "next/headers";
import { getUserFromAccessToken } from "@/lib/auth-user";

export default async function Home() {
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get("accessToken")?.value?.trim() ||
    cookieStore.get("algory_access_token")?.value?.trim() ||
    null;
  const initialUser = getUserFromAccessToken(accessToken);

  return <Index initialUser={initialUser} />;
}
