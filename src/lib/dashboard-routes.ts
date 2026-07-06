export const DASHBOARD_ROUTES = {
  root: "/dashboard",
  overview: "/dashboard/genel-bakis",
  analytics: "/dashboard/analitik",
  qrCodes: "/dashboard/qr-kodlarim",
  qrCodesNew: "/dashboard/qr-kodlarim/yeni",
  qrCodeDetail: (id: number | string) => `/dashboard/qr-kodlarim/${id}`,
  account: "/dashboard/hesabim",
  accountSubscription: "/dashboard/hesabim/abonelik",
  accountSubscriptionCheckout: (packageId: number | string) =>
    `/dashboard/hesabim/abonelik/satin-al/${packageId}`,
} as const;

export type DashboardNavKey = "overview" | "analytics" | "qrCodes" | "account";

export const DASHBOARD_NAV_ITEMS: Array<{
  key: DashboardNavKey;
  label: string;
  href: string;
  mobileLabel: string;
}> = [
  { key: "overview", label: "Genel Bakış", mobileLabel: "Genel", href: DASHBOARD_ROUTES.overview },
  { key: "analytics", label: "Analitik", mobileLabel: "Analitik", href: DASHBOARD_ROUTES.analytics },
  { key: "qrCodes", label: "QR Kodlarım", mobileLabel: "QR Kodlar", href: DASHBOARD_ROUTES.qrCodes },
  { key: "account", label: "Hesabım", mobileLabel: "Hesabım", href: DASHBOARD_ROUTES.account },
];

export function isDashboardNavActive(pathname: string, href: string): boolean {
  if (href === DASHBOARD_ROUTES.qrCodes) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
