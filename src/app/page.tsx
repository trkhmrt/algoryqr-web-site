import Index from "@/views/Index";
import { cookies } from "next/headers";
import { getUserFromAccessToken } from "@/lib/auth-user";

export default async function Home() {
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get("algory_access_token")?.value ||
    cookieStore.get("accessToken")?.value ||
    null;
  const initialUser = getUserFromAccessToken(accessToken);

  return <Index initialUser={initialUser} />;
}
