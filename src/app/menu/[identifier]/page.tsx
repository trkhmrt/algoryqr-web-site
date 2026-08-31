import { redirect } from "next/navigation";

import { publicMenuContentPath } from "@/lib/public-menu-paths";

export default async function PublicMenuEntryRedirect({
  params,
}: {
  params: Promise<{ identifier: string }>;
}) {
  const { identifier } = await params;
  redirect(publicMenuContentPath(identifier));
}
