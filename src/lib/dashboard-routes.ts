import type { ProductScope } from "@/lib/auth-user";

export const DASHBOARD_ROUTES = {
  root: "/dashboard",
  overview: "/dashboard/genel-bakis",
  analytics: "/dashboard/dijital-menu/analitik",
  analyticsLegacy: "/dashboard/analitik",
  digitalMenu: "/dashboard/dijital-menu",
  digitalMenuProducts: "/dashboard/dijital-menu/urunler",
  digitalMenuProductCreate: "/dashboard/dijital-menu/urunler/yeni",
  digitalMenuProductCreateFor: (
    qrId?: number | string | null,
    subCategoryId?: number | string | null,
  ) => {
    const params = new URLSearchParams();
    if (qrId != null && qrId !== "") params.set("qr", String(qrId));
    if (subCategoryId != null && subCategoryId !== "") params.set("category", String(subCategoryId));
    const query = params.toString();
    return query
      ? `/dashboard/dijital-menu/urunler/yeni?${query}`
      : "/dashboard/dijital-menu/urunler/yeni";
  },
  digitalMenuProductDetail: (productId: number | string, qrId: number | string) =>
    `/dashboard/dijital-menu/urunler/${productId}?qr=${qrId}`,
  digitalMenuCategories: "/dashboard/dijital-menu/kategoriler",
  digitalMenuCreate: "/dashboard/dijital-menu/olustur",
  digitalMenuCreateForBranch: (branchId: number | string) =>
    `/dashboard/dijital-menu/olustur?branch=${branchId}`,
  branchCreate: "/dashboard/dijital-menu/subeler/yeni",
  branchSettings: (branchId: number | string) =>
    `/dashboard/dijital-menu/subeler/${branchId}/ayarlar`,
  catalogProductCheckout: (code: string) =>
    `/dashboard/dijital-menu/urun-satin-al/${encodeURIComponent(code)}`,
  digitalMenuEdit: (qrId: number | string) => `/dashboard/dijital-menu/qr/${qrId}`,
  digitalMenuSettings: (qrId: number | string) =>
    `/dashboard/dijital-menu/qr/${qrId}/ayarlar`,
  digitalMenuProductsForQr: (qrId: number | string) =>
    `/dashboard/dijital-menu/urunler?qr=${qrId}`,
  digitalMenuCategoriesForQr: (qrId: number | string) =>
    `/dashboard/dijital-menu/kategoriler?qr=${qrId}`,
  digitalMenuAnalytics: (qrId: number | string) =>
    `/dashboard/dijital-menu/analitik?qr=${qrId}`,
  digitalMenuAnalyticsForBranch: (
    branchId: number | string,
    qrId?: number | string | null,
  ) => {
    const params = new URLSearchParams();
    params.set("branch", String(branchId));
    if (qrId != null && qrId !== "") params.set("qr", String(qrId));
    return `/dashboard/dijital-menu/analitik?${params.toString()}`;
  },
  smartReports: "/dashboard/dijital-menu/akilli-raporlar",
  smartReportDetail: (jobId: string) =>
    `/dashboard/dijital-menu/akilli-raporlar/${jobId}`,
  feedback: "/dashboard/dijital-menu/geri-bildirimler",
  feedbackForQr: (qrId: number | string) =>
    `/dashboard/dijital-menu/geri-bildirimler?qr=${qrId}`,
  reservations: "/dashboard/dijital-menu/rezervasyonlar",
  reservationsForQr: (qrId: number | string) =>
    `/dashboard/dijital-menu/rezervasyonlar?qr=${qrId}`,
  restaurantLayout: "/dashboard/dijital-menu/restaurant-layout",
  restaurantLayoutForQr: (qrId: number | string) =>
    `/dashboard/dijital-menu/restaurant-layout?qr=${qrId}`,
  trendyolGo: "/dashboard/trendyol-go",
  trendyolGoProducts: "/dashboard/trendyol-go/urunler",
  trendyolGoOrders: "/dashboard/trendyol-go/siparisler",
  orderPanel: "/dashboard/siparis-paneli",
  orderPanelReports: "/dashboard/siparis-paneli/raporlar",
  orderPanelReportsForQr: (qrId: number | string) =>
    `/dashboard/siparis-paneli/raporlar?qr=${qrId}`,
  orderPanelReportsForBranch: (
    branchId: number | string,
    qrId?: number | string | null,
  ) => {
    const params = new URLSearchParams();
    params.set("branch", String(branchId));
    if (qrId != null && qrId !== "") params.set("qr", String(qrId));
    return `/dashboard/siparis-paneli/raporlar?${params.toString()}`;
  },
  muhasebe: "/dashboard/muhasebe",
  waiter: "/dashboard/garson",
  waiterForQr: (qrId: number | string) =>
    `/dashboard/garson?qr=${qrId}`,
  menuUsers: "/dashboard/kullanicilar",
  menuUsersForBranch: (branchId: number | string) =>
    `/dashboard/kullanicilar?branch=${branchId}`,
  menuUserDetail: (waiterId: number | string, branchId?: number | string | null) =>
    branchId != null && branchId !== ""
      ? `/dashboard/kullanicilar/${waiterId}?branch=${branchId}`
      : `/dashboard/kullanicilar/${waiterId}`,
  menuCustomers: "/dashboard/musteriler",
  menuCustomersForQr: (qrId: number | string) =>
    `/dashboard/musteriler?qr=${qrId}`,
  campaigns: "/dashboard/kampanyalar",
  campaignsCreate: "/dashboard/kampanyalar/yeni",
  campaignDetail: (campaignId: number | string) => `/dashboard/kampanyalar/${campaignId}`,
  campaignDetailForQr: (campaignId: number | string, qrId: number | string) =>
    `/dashboard/kampanyalar/${campaignId}?qr=${qrId}`,
  campaignsForQr: (qrId: number | string) =>
    `/dashboard/kampanyalar?qr=${qrId}`,
  waiterLogin: "/waiter/login",
  waiterPanel: "/waiter",

  digitalMenuCheckout: (packageId: number | string) =>
    `/dashboard/dijital-menu/satin-al/${packageId}`,
  qrCodes: "/dashboard/qr-kodlarim",
  qrCodesNew: "/dashboard/qr-kodlarim/yeni",
  qrCodeDetail: (id: number | string) => `/dashboard/qr-kodlarim/${id}`,
  account: "/dashboard/hesabim",
  accountSecurity: "/dashboard/hesabim/guvenlik",
  accountSessions: "/dashboard/hesabim/oturumlar",
  accountSessionsDetail: "/dashboard/hesabim/oturumlar/detay",
  accountSubscription: "/dashboard/hesabim/abonelik",
  accountPackages: "/dashboard/hesabim/abonelik/paketler",
  accountPackagesHighlight: (highlight: string) =>
    `/dashboard/hesabim/abonelik/paketler?highlight=${encodeURIComponent(highlight)}`,
  accountPlanChange: (packageId: number | string) =>
    `/dashboard/hesabim/abonelik/paket-degistir?to=${packageId}`,
  accountSubscriptionCheckout: (packageId: number | string) =>
    `/dashboard/hesabim/abonelik/satin-al/${packageId}`,
  accountPurchaseDetail: (purchaseId: number | string) =>
    `/dashboard/hesabim/abonelik/satin-alma/${purchaseId}`,
  accountPaymentHistory: "/dashboard/hesabim/odeme-gecmisi",
  accountPaymentHistoryDetail: (purchaseId: number | string) =>
    `/dashboard/hesabim/odeme-gecmisi/${purchaseId}`,
  accountPaymentMethods: "/dashboard/hesabim/kayitli-kartlarim",
  accountBillingAddresses: "/dashboard/hesabim/fatura-adreslerim",
  trialStart: "/dashboard/deneme/baslat",
} as const;

export type DashboardNavKey =
  | "overview"
  | "digitalMenu"
  | "reservations"
  | "trendyolGo"
  | "orderPanel"
  | "reports"
  | "accounting"
  | "menuUsers"
  | "menuCustomers"
  | "campaigns"
  | "qrCodes"
  | "account";

export type DashboardNavItem = {
  key: DashboardNavKey;
  label: string;
  href: string;
  mobileLabel: string;
  requiredScope?: ProductScope;
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { key: "overview", label: "Genel Bakış", mobileLabel: "Genel", href: DASHBOARD_ROUTES.overview },
  {
    key: "digitalMenu",
    label: "Dijital Menü",
    mobileLabel: "Menü",
    href: DASHBOARD_ROUTES.digitalMenu,
    requiredScope: "QR_MENU_OWNER",
  },
  {
    key: "reservations",
    label: "Rezervasyonlar",
    mobileLabel: "Rezervasyon",
    href: DASHBOARD_ROUTES.reservations,
    requiredScope: "QR_MENU_OWNER",
  },
  {
    key: "trendyolGo",
    label: "Trendyol Go",
    mobileLabel: "TGO",
    href: DASHBOARD_ROUTES.trendyolGo,
    requiredScope: "QR_MENU_OWNER",
  },
  {
    key: "orderPanel",
    label: "Sipariş Paneli",
    mobileLabel: "Sipariş",
    href: DASHBOARD_ROUTES.orderPanel,
    requiredScope: "WAITER_PANEL_OWNER",
  },
  {
    key: "reports",
    label: "Raporlar",
    mobileLabel: "Raporlar",
    href: DASHBOARD_ROUTES.analytics,
    requiredScope: "SMART_REPORTING_OWNER",
  },
  {
    key: "accounting",
    label: "Muhasebe",
    mobileLabel: "Muhasebe",
    href: DASHBOARD_ROUTES.muhasebe,
  },
  {
    key: "menuUsers",
    label: "Kullanıcılar",
    mobileLabel: "Kullanıcılar",
    href: DASHBOARD_ROUTES.menuUsers,
    requiredScope: "WAITER_PANEL_OWNER",
  },
  {
    key: "menuCustomers",
    label: "Müşteriler",
    mobileLabel: "Müşteriler",
    href: DASHBOARD_ROUTES.menuCustomers,
    requiredScope: "WAITER_PANEL_OWNER",
  },
  {
    key: "campaigns",
    label: "Kampanyalar",
    mobileLabel: "Kampanyalar",
    href: DASHBOARD_ROUTES.campaigns,
    requiredScope: "QR_MENU_OWNER",
  },
  {
    key: "qrCodes",
    label: "QR Kodlarım",
    mobileLabel: "QR Kodlar",
    href: DASHBOARD_ROUTES.qrCodes,
    requiredScope: "QR_CREATE_OWNER",
  },
  { key: "account", label: "Hesabım", mobileLabel: "Hesabım", href: DASHBOARD_ROUTES.account },
];

export function isDashboardNavActive(pathname: string, href: string): boolean {
  if (href === DASHBOARD_ROUTES.digitalMenu) {
    return isDigitalMenuSectionActive(pathname);
  }
  if (href === DASHBOARD_ROUTES.reservations) {
    return isReservationsSectionActive(pathname);
  }
  if (href === DASHBOARD_ROUTES.trendyolGo) {
    return isTrendyolGoSectionActive(pathname);
  }
  if (href === DASHBOARD_ROUTES.orderPanel) {
    return isOrderPanelSectionActive(pathname);
  }
  if (href === DASHBOARD_ROUTES.analytics) {
    return isReportsSectionActive(pathname);
  }
  if (href === DASHBOARD_ROUTES.muhasebe) {
    return pathname === DASHBOARD_ROUTES.muhasebe;
  }
  if (href === DASHBOARD_ROUTES.menuUsers) {
    return (
      pathname === DASHBOARD_ROUTES.menuUsers ||
      pathname.startsWith(`${DASHBOARD_ROUTES.menuUsers}/`)
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isReportsSectionActive(pathname: string): boolean {
  return (
    pathname === DASHBOARD_ROUTES.analytics ||
    pathname.startsWith(`${DASHBOARD_ROUTES.analytics}/`) ||
    pathname === DASHBOARD_ROUTES.analyticsLegacy ||
    pathname === DASHBOARD_ROUTES.smartReports ||
    pathname.startsWith(`${DASHBOARD_ROUTES.smartReports}/`)
  );
}

export function isOrderPanelSectionActive(pathname: string): boolean {
  return (
    pathname === DASHBOARD_ROUTES.orderPanel ||
    pathname.startsWith(`${DASHBOARD_ROUTES.orderPanel}/`) ||
    pathname === DASHBOARD_ROUTES.waiter ||
    pathname.startsWith(`${DASHBOARD_ROUTES.waiter}/`)
  );
}

export function isReservationsSectionActive(pathname: string): boolean {
  return (
    pathname === DASHBOARD_ROUTES.reservations ||
    pathname.startsWith(`${DASHBOARD_ROUTES.reservations}/`)
  );
}

export function isTrendyolGoSectionActive(pathname: string): boolean {
  return (
    pathname === DASHBOARD_ROUTES.trendyolGo ||
    pathname.startsWith(`${DASHBOARD_ROUTES.trendyolGo}/`)
  );
}

export function isDigitalMenuSectionActive(pathname: string): boolean {
  if (
    isReportsSectionActive(pathname) ||
    isOrderPanelSectionActive(pathname) ||
    isReservationsSectionActive(pathname)
  ) {
    return false;
  }
  return (
    pathname === DASHBOARD_ROUTES.digitalMenu ||
    pathname.startsWith(`${DASHBOARD_ROUTES.digitalMenu}/`)
  );
}
