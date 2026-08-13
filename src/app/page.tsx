import { cookies } from "next/headers";

import JsonLd from "@/components/JsonLd";
import Index from "@/views/Index";
import { getUserFromAccessToken } from "@/lib/auth-user";
import { FAQ_ITEMS } from "@/lib/faq";
import { faqJsonLd } from "@/lib/seo";

export default async function Home() {
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get("accessToken")?.value?.trim() ||
    cookieStore.get("algory_access_token")?.value?.trim() ||
    null;
  const initialUser = getUserFromAccessToken(accessToken);

  return (
    <>
      <JsonLd data={faqJsonLd(FAQ_ITEMS)} />
      <Index initialUser={initialUser} />
    </>
  );
}
