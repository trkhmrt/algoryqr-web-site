import { MenuTemplateRenderer } from "@/components/menu-templates/MenuTemplateRenderer";
import MenuUnavailableView from "@/components/menu-templates/MenuUnavailableView";
import { fetchPublicMenu } from "@/lib/public-menu-fetch";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PublicMenuContentPage({
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
  const result = await fetchPublicMenu(identifier, { tableToken: tableToken || undefined });

  if (result.status === "package_inactive") {
    return <MenuUnavailableView />;
  }
  if (result.status !== "ok") {
    notFound();
  }

  return (
    <MenuTemplateRenderer
      menu={result.data.menu}
      products={result.data.products}
      categories={result.data.categories ?? []}
      themeId={result.data.themeId}
      identifier={result.publicId}
      productPage={result.data.productPage ?? 0}
      productSize={result.data.productSize ?? 20}
      productTotalElements={result.data.productTotalElements ?? result.data.products.length}
      productHasNext={result.data.productHasNext ?? false}
      categoryPage={result.data.categoryPage ?? 0}
      categorySize={result.data.categorySize ?? 50}
      categoryTotalElements={result.data.categoryTotalElements}
      categoryHasNext={result.data.categoryHasNext ?? false}
    />
  );
}
