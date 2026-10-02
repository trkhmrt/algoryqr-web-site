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

  const parseId = (value: string | string[] | undefined): number | undefined => {
    const rawValue = typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
    if (!rawValue) return undefined;
    const parsed = Number.parseInt(rawValue, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };

  redirect(
    buildPublicMenuContentPath(identifier, {
      tableToken: tableToken || undefined,
      categoryId: parseId(query.categoryId),
      subCategoryId: parseId(query.subCategoryId),
      productId: parseId(query.productId),
    }),
  );
}
