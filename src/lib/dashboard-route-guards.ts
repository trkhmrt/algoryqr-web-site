import type { ProductScope } from "@/lib/auth-user";
import {
  DASHBOARD_ROUTES,
  isDigitalMenuSectionActive,
  isReportsSectionActive,
  isTrendyolGoSectionActive,
} from "@/lib/dashboard-routes";

function pathMatches(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function resolveRequiredScope(pathname: string): ProductScope | null {
  if (pathname === DASHBOARD_ROUTES.reportsHub) {
    return null;
  }

  if (
    pathname === DASHBOARD_ROUTES.orderPanel ||
    pathname === DASHBOARD_ROUTES.waiter ||
    pathname.startsWith(`${DASHBOARD_ROUTES.waiter}/`) ||
    pathname === DASHBOARD_ROUTES.orderPanelReports ||
    pathname.startsWith(`${DASHBOARD_ROUTES.orderPanelReports}/`) ||
    pathname === DASHBOARD_ROUTES.restaurantLayout ||
    pathname.startsWith(`${DASHBOARD_ROUTES.restaurantLayout}/`) ||
    pathMatches(pathname, DASHBOARD_ROUTES.menuUsers) ||
    pathMatches(pathname, DASHBOARD_ROUTES.menuCustomers)
  ) {
    return "WAITER_PANEL_OWNER";
  }

  if (isReportsSectionActive(pathname)) {
    return "SMART_REPORTING_OWNER";
  }

  if (pathMatches(pathname, DASHBOARD_ROUTES.campaigns) || isTrendyolGoSectionActive(pathname)) {
    return "QR_MENU_OWNER";
  }

  if (pathMatches(pathname, DASHBOARD_ROUTES.qrCodes)) {
    return "QR_CREATE_OWNER";
  }

  if (isDigitalMenuSectionActive(pathname)) {
    return "QR_MENU_OWNER";
  }

  return null;
}

export const ROUTE_SCOPES: Partial<Record<string, ProductScope>> = {
  [DASHBOARD_ROUTES.reportsHub]: "SMART_REPORTING_OWNER",
  [DASHBOARD_ROUTES.orderPanel]: "WAITER_PANEL_OWNER",
  [DASHBOARD_ROUTES.waiter]: "WAITER_PANEL_OWNER",
  [DASHBOARD_ROUTES.menuUsers]: "WAITER_PANEL_OWNER",
  [DASHBOARD_ROUTES.menuCustomers]: "WAITER_PANEL_OWNER",
  [DASHBOARD_ROUTES.campaigns]: "QR_MENU_OWNER",
  [DASHBOARD_ROUTES.restaurantLayout]: "WAITER_PANEL_OWNER",
  [DASHBOARD_ROUTES.orderPanelReports]: "WAITER_PANEL_OWNER",
  [DASHBOARD_ROUTES.analytics]: "SMART_REPORTING_OWNER",
  [DASHBOARD_ROUTES.analyticsLegacy]: "SMART_REPORTING_OWNER",
  [DASHBOARD_ROUTES.smartReports]: "SMART_REPORTING_OWNER",
  [DASHBOARD_ROUTES.qrCodes]: "QR_CREATE_OWNER",
  [DASHBOARD_ROUTES.digitalMenu]: "QR_MENU_OWNER",
  [DASHBOARD_ROUTES.trendyolGo]: "QR_MENU_OWNER",
  [DASHBOARD_ROUTES.trendyolGoProducts]: "QR_MENU_OWNER",
  [DASHBOARD_ROUTES.trendyolGoOrders]: "QR_MENU_OWNER",
  [DASHBOARD_ROUTES.uberEats]: "QR_MENU_OWNER",
  [DASHBOARD_ROUTES.uberEatsPending]: "QR_MENU_OWNER",
};
