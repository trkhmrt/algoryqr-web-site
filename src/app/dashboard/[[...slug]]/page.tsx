import { redirect } from "next/navigation";

import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

export default async function DashboardCatchAllPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  if (!slug || slug.length === 0) {
    redirect(DASHBOARD_ROUTES.overview);
  }
  return null;
}
