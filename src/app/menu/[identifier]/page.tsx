import { redirect } from "next/navigation";

import { buildPublicMenuContentPath } from "@/lib/public-menu-paths";

export default async function PublicMenuEntryRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ identifier: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { identifier } = await params;
  const query = await searchParams;
  const raw = query.t;
  const tableToken = typeof raw === "string" ? raw.trim() : Array.isArray(raw) ? raw[0]?.trim() : undefined;
  redirect(buildPublicMenuContentPath(identifier, { tableToken: tableToken || undefined }));
}
