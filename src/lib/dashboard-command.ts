import type { ProductScope } from "@/lib/auth-user";
import { DASHBOARD_NAV_ITEMS, DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

export type DashboardCommandEntry = {
  id: string;
  label: string;
  href: string;
  group: string;
  keywords: string;
  requiredScope?: ProductScope;
  external?: boolean;
};

const EXTRA_COMMANDS: DashboardCommandEntry[] = [
  {
    id: "reservations",
    label: "Rezervasyonlar",
    href: DASHBOARD_ROUTES.reservations,
    group: "Operasyon",
    keywords: "rezervasyon masa misafir",
    requiredScope: "QR_MENU_OWNER",
  },
  {
    id: "products",
    label: "Ürünler",
    href: DASHBOARD_ROUTES.digitalMenuProducts,
    group: "Menü",
    keywords: "ürün yemek fiyat",
    requiredScope: "QR_MENU_OWNER",
  },
  {
    id: "feedback",
    label: "Geri bildirimler",
    href: DASHBOARD_ROUTES.feedback,
    group: "Menü",
    keywords: "yorum puan şikayet",
    requiredScope: "QR_MENU_OWNER",
  },
  {
    id: "waiter-app",
    label: "Garson uygulaması",
    href: DASHBOARD_ROUTES.waiterPanel,
    group: "Operasyon",
    keywords: "garson masa sipariş",
    requiredScope: "WAITER_PANEL_OWNER",
    external: true,
  },
  {
    id: "subscription",
    label: "Abonelik",
    href: DASHBOARD_ROUTES.accountSubscription,
    group: "Hesap",
    keywords: "paket fatura abonelik",
  },
];

export function getDashboardCommandEntries(): DashboardCommandEntry[] {
  const fromNav = DASHBOARD_NAV_ITEMS.map((item) => ({
    id: item.key,
    label: item.label,
    href: item.href,
    group: "Sayfalar",
    keywords: `${item.label} ${item.mobileLabel}`,
    requiredScope: item.requiredScope,
  }));
  return [...fromNav, ...EXTRA_COMMANDS];
}

export function filterCommandEntries(
  entries: DashboardCommandEntry[],
  query: string,
  allowed: (scope?: ProductScope) => boolean,
): DashboardCommandEntry[] {
  const needle = query.trim().toLocaleLowerCase("tr");
  return entries.filter((entry) => {
    if (!allowed(entry.requiredScope)) return false;
    if (!needle) return true;
    const haystack = `${entry.label} ${entry.keywords}`.toLocaleLowerCase("tr");
    return haystack.includes(needle);
  });
}
