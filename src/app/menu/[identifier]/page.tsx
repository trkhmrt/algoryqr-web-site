import { MenuTemplateRenderer } from "@/components/menu-templates/MenuTemplateRenderer";
import MenuUnavailableView from "@/components/menu-templates/MenuUnavailableView";
import type { PublicMenuApiResponse } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import axios from "axios";
import { notFound } from "next/navigation";

const MENU_OWNER_PACKAGE_INACTIVE = "MENU_OWNER_PACKAGE_INACTIVE";

type PublicMenuFetchResult =
  | { status: "ok"; data: PublicMenuApiResponse }
  | { status: "package_inactive" }
  | { status: "not_found" };

async function fetchPublicMenu(identifier: string): Promise<PublicMenuFetchResult> {
  if (!/^\d+$/.test(identifier)) {
    return { status: "not_found" };
  }
  const path = `${API_BASE_URL}/menu/public/id/${identifier}`;

  try {
    const response = await axios.get<PublicMenuApiResponse>(path, { timeout: 15_000 });
    return { status: "ok", data: response.data };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      const code = (error.response.data as { code?: string } | undefined)?.code;
      if (code === MENU_OWNER_PACKAGE_INACTIVE || code == null) {
        return { status: "package_inactive" };
      }
    }
    return { status: "not_found" };
  }
}

export default async function PublicMenuPage({ params }: { params: Promise<{ identifier: string }> }) {
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
      productPage={result.data.productPage ?? 0}
      productSize={result.data.productSize ?? 20}
      productTotalElements={result.data.productTotalElements ?? result.data.products.length}
      productHasNext={result.data.productHasNext ?? false}
    />
  );
}
