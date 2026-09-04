import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

export const SELECTED_MENU_QR_STORAGE_KEY = "algory_selected_menu_qr_id";

export function readStoredMenuQrId(): number | null {
  if (typeof window === "undefined") return null;
  const stored = Number(window.sessionStorage.getItem(SELECTED_MENU_QR_STORAGE_KEY));
  return Number.isFinite(stored) && stored > 0 ? stored : null;
}

export function resolveDigitalMenuProductsHref(qrId?: number | null): string {
  const resolved = qrId ?? readStoredMenuQrId();
  return resolved != null
    ? DASHBOARD_ROUTES.digitalMenuProductsForQr(resolved)
    : DASHBOARD_ROUTES.digitalMenuProducts;
}

export function resolveDigitalMenuMenusHref(qrId?: number | null): string {
  const resolved = qrId ?? readStoredMenuQrId();
  return resolved != null
    ? DASHBOARD_ROUTES.digitalMenuEdit(resolved)
    : DASHBOARD_ROUTES.digitalMenu;
}
