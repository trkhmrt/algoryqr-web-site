import { MenuTemplateRenderer } from "@/components/menu-templates/MenuTemplateRenderer";
import MenuUnavailableView from "@/components/menu-templates/MenuUnavailableView";
import { fetchPublicMenu, PUBLIC_MENU_REVALIDATE_SECONDS } from "@/lib/public-menu-fetch";
import { notFound } from "next/navigation";

export const revalidate = PUBLIC_MENU_REVALIDATE_SECONDS;

export default async function PublicMenuContentPage({
  params,
}: {
  params: Promise<{ identifier: string }>;
}) {
  const { identifier } = await params;
  const result = await fetchPublicMenu(identifier);

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
      identifier={identifier}
      productPage={result.data.productPage ?? 0}
      productSize={result.data.productSize ?? 20}
      productTotalElements={result.data.productTotalElements ?? result.data.products.length}
      productHasNext={result.data.productHasNext ?? false}
      categoryPage={result.data.categoryPage ?? 0}
      categorySize={result.data.categorySize ?? 6}
      categoryTotalElements={result.data.categoryTotalElements}
      categoryHasNext={result.data.categoryHasNext ?? false}
    />
  );
}
