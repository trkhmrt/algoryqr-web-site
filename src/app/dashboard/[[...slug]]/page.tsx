import { redirect } from "next/navigation";

import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

const LEGACY_DASHBOARD_REDIRECTS: Record<string, string> = {
  "dijital-menu/restoran-duzeni": DASHBOARD_ROUTES.restaurantLayout,
  "dijital-menu/garson": DASHBOARD_ROUTES.waiter,
  "dijital-menu/waiter-orders": DASHBOARD_ROUTES.waiter,
  "dijital-menu/kullanicilar": DASHBOARD_ROUTES.menuUsers,
  "dijital-menu/musteriler": DASHBOARD_ROUTES.menuCustomers,
  "dijital-menu/users": DASHBOARD_ROUTES.menuUsers,
  "dijital-menu/customers": DASHBOARD_ROUTES.menuCustomers,
};

function toQueryString(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      params.set(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export default async function DashboardCatchAllPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  if (!slug || slug.length === 0) {
    redirect(DASHBOARD_ROUTES.overview);
  }

  const pathKey = slug.join("/");
  const target = LEGACY_DASHBOARD_REDIRECTS[pathKey];
  if (target) {
    const query = toQueryString(await searchParams);
    redirect(`${target}${query}`);
  }

  return null;
}
