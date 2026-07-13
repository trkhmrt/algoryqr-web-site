import { MenuTemplateRenderer } from "@/components/menu-templates/MenuTemplateRenderer";
import type { PublicMenuApiResponse } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import axios from "axios";
import { notFound } from "next/navigation";

async function fetchPublicMenu(identifier: string): Promise<PublicMenuApiResponse | null> {
  const isNumeric = /^\d+$/.test(identifier);
  const path = isNumeric
    ? `${API_BASE_URL}/menu/public/id/${identifier}`
    : `${API_BASE_URL}/menu/public/slug/${encodeURIComponent(identifier)}`;

  try {
    const response = await axios.get<PublicMenuApiResponse>(path, { timeout: 15_000 });
    return response.data;
  } catch {
    return null;
  }
}

export default async function PublicMenuPage({ params }: { params: Promise<{ identifier: string }> }) {
  const { identifier } = await params;
  const data = await fetchPublicMenu(identifier);
  if (!data) notFound();

  return <MenuTemplateRenderer menu={data.menu} products={data.products} themeId={data.themeId} />;
}
