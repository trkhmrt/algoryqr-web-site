"use client";

import { Suspense, useMemo } from "react";
import { usePathname } from "next/navigation";

import AnalyticsTab from "@/components/dashboard/AnalyticsTab";
import PackagePurchaseView from "@/components/dashboard/PackagePurchaseView";
import SettingsTab from "@/components/dashboard/SettingsTab";
import SubscriptionSection from "@/components/dashboard/SubscriptionSection";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import type { StoredUser } from "@/lib/api";
import DashboardOverviewView from "@/views/dashboard/DashboardOverviewView";
import DashboardQrCodesView from "@/views/dashboard/DashboardQrCodesView";
import BillingAddressesView from "@/views/dashboard/BillingAddressesView";
import DigitalMenuView from "@/views/dashboard/DigitalMenuView";
import DigitalMenuCreateView from "@/views/dashboard/DigitalMenuCreateView";
import DigitalMenuEditorView from "@/views/dashboard/DigitalMenuEditorView";
import DigitalMenuSettingsView from "@/views/dashboard/DigitalMenuSettingsView";
import DigitalMenuProductsView from "@/views/dashboard/DigitalMenuProductsView";
import DigitalMenuProductDetailView from "@/views/dashboard/DigitalMenuProductDetailView";
import DigitalMenuCategoriesView from "@/views/dashboard/DigitalMenuCategoriesView";
import PackageComparisonView from "@/views/dashboard/PackageComparisonView";
import PaymentMethodsView from "@/views/dashboard/PaymentMethodsView";
import PlanChangeView from "@/views/dashboard/PlanChangeView";
import PurchaseDetailView from "@/views/dashboard/PurchaseDetailView";

interface DashboardPageClientProps {
  initialUser?: StoredUser | null;
}

export default function DashboardPageClient({ initialUser = null }: DashboardPageClientProps) {
  const pathname = usePathname();
  const { notify } = useDashboardBanners();

  const qrRoute = useMemo(() => {
    if (!pathname.startsWith(DASHBOARD_ROUTES.qrCodes)) return null;
    if (pathname === DASHBOARD_ROUTES.qrCodesNew) {
      return { mode: "create" as const };
    }
    const prefix = `${DASHBOARD_ROUTES.qrCodes}/`;
    if (pathname.startsWith(prefix)) {
      const slug = pathname.slice(prefix.length).split("/")[0];
      const id = Number(slug);
      if (slug && Number.isFinite(id)) {
        return { mode: "detail" as const, qrId: id };
      }
    }
    return { mode: "list" as const };
  }, [pathname]);

  const accountRoute = useMemo(() => {
    if (!pathname.startsWith(DASHBOARD_ROUTES.account)) return null;
    if (pathname === DASHBOARD_ROUTES.accountPackages) {
      return { mode: "packages" as const };
    }
    if (pathname === `${DASHBOARD_ROUTES.accountSubscription}/paket-degistir`) {
      return { mode: "planChange" as const };
    }
    if (pathname === DASHBOARD_ROUTES.accountSubscription) {
      return { mode: "subscription" as const };
    }
    if (pathname === DASHBOARD_ROUTES.accountPaymentMethods) {
      return { mode: "paymentMethods" as const };
    }
    if (pathname === DASHBOARD_ROUTES.accountBillingAddresses) {
      return { mode: "billingAddresses" as const };
    }
    const checkoutPrefix = `${DASHBOARD_ROUTES.accountSubscription}/satin-al/`;
    if (pathname.startsWith(checkoutPrefix)) {
      const slug = pathname.slice(checkoutPrefix.length).split("/")[0];
      const packageId = Number(slug);
      if (slug && Number.isFinite(packageId)) {
        return { mode: "checkout" as const, packageId };
      }
    }
    const purchaseDetailPrefix = `${DASHBOARD_ROUTES.accountSubscription}/satin-alma/`;
    if (pathname.startsWith(purchaseDetailPrefix)) {
      const slug = pathname.slice(purchaseDetailPrefix.length).split("/")[0];
      const purchaseId = Number(slug);
      if (slug && Number.isSafeInteger(purchaseId) && purchaseId > 0) {
        return { mode: "purchaseDetail" as const, purchaseId };
      }
    }
    if (pathname === DASHBOARD_ROUTES.account) {
      return { mode: "main" as const };
    }
    return null;
  }, [pathname]);

  const digitalMenuCheckout = useMemo(() => {
    const prefix = `${DASHBOARD_ROUTES.digitalMenu}/satin-al/`;
    if (!pathname.startsWith(prefix)) return null;
    const packageId = Number(pathname.slice(prefix.length).split("/")[0]);
    return Number.isSafeInteger(packageId) && packageId > 0 ? packageId : null;
  }, [pathname]);

  const digitalMenuSettingsQrId = useMemo(() => {
    const prefix = `${DASHBOARD_ROUTES.digitalMenu}/qr/`;
    if (!pathname.startsWith(prefix)) return null;
    const rest = pathname.slice(prefix.length);
    const [qrSlug, settingsSlug] = rest.split("/");
    if (settingsSlug !== "ayarlar") return null;
    const qrId = Number(qrSlug);
    return Number.isSafeInteger(qrId) && qrId > 0 ? qrId : null;
  }, [pathname]);

  const digitalMenuEditQrId = useMemo(() => {
    const prefix = `${DASHBOARD_ROUTES.digitalMenu}/qr/`;
    if (!pathname.startsWith(prefix)) return null;
    const rest = pathname.slice(prefix.length);
    if (rest.includes("/")) return null;
    const qrId = Number(rest);
    return Number.isSafeInteger(qrId) && qrId > 0 ? qrId : null;
  }, [pathname]);

  const digitalMenuProductId = useMemo(() => {
    const prefix = `${DASHBOARD_ROUTES.digitalMenuProducts}/`;
    if (!pathname.startsWith(prefix)) return null;
    const productId = Number(pathname.slice(prefix.length).split("/")[0]);
    return Number.isSafeInteger(productId) && productId > 0 ? productId : null;
  }, [pathname]);

  if (pathname === DASHBOARD_ROUTES.overview || pathname === DASHBOARD_ROUTES.root) {
    return <DashboardOverviewView />;
  }

  if (
    pathname === DASHBOARD_ROUTES.analytics ||
    pathname === DASHBOARD_ROUTES.analyticsLegacy
  ) {
    return (
      <Suspense fallback={null}>
        <AnalyticsTab />
      </Suspense>
    );
  }

  if (digitalMenuCheckout) {
    return (
      <PackagePurchaseView
        packageId={digitalMenuCheckout}
        onNotify={notify}
        returnHref={DASHBOARD_ROUTES.digitalMenu}
      />
    );
  }

  if (pathname === DASHBOARD_ROUTES.digitalMenuCreate) {
    return <DigitalMenuCreateView />;
  }

  if (digitalMenuProductId != null) {
    return (
      <Suspense fallback={null}>
        <DigitalMenuProductDetailView productId={digitalMenuProductId} />
      </Suspense>
    );
  }

  if (pathname === DASHBOARD_ROUTES.digitalMenuProducts) {
    return (
      <Suspense fallback={null}>
        <DigitalMenuProductsView />
      </Suspense>
    );
  }

  if (pathname === DASHBOARD_ROUTES.digitalMenuCategories) {
    return (
      <Suspense fallback={null}>
        <DigitalMenuCategoriesView />
      </Suspense>
    );
  }

  if (digitalMenuSettingsQrId != null) {
    return <DigitalMenuSettingsView qrId={digitalMenuSettingsQrId} />;
  }

  if (digitalMenuEditQrId != null) {
    return <DigitalMenuEditorView qrId={digitalMenuEditQrId} />;
  }

  if (pathname === DASHBOARD_ROUTES.digitalMenu) {
    return <DigitalMenuView />;
  }

  if (qrRoute) {
    return (
      <DashboardQrCodesView
        mode={qrRoute.mode}
        qrId={qrRoute.qrId}
        initialUser={initialUser}
      />
    );
  }

  if (accountRoute?.mode === "checkout") {
    return <PackagePurchaseView packageId={accountRoute.packageId} onNotify={notify} />;
  }

  if (accountRoute?.mode === "purchaseDetail") {
    return <PurchaseDetailView purchaseId={accountRoute.purchaseId} />;
  }

  if (accountRoute?.mode === "packages") {
    return (
      <Suspense fallback={null}>
        <PackageComparisonView />
      </Suspense>
    );
  }

  if (accountRoute?.mode === "planChange") {
    return (
      <Suspense fallback={null}>
        <PlanChangeView onNotify={notify} />
      </Suspense>
    );
  }

  if (accountRoute?.mode === "subscription") {
    return (
      <Suspense fallback={null}>
        <SubscriptionSection onNotify={notify} />
      </Suspense>
    );
  }

  if (accountRoute?.mode === "paymentMethods") {
    return <PaymentMethodsView />;
  }

  if (accountRoute?.mode === "billingAddresses") {
    return <BillingAddressesView />;
  }

  if (pathname === DASHBOARD_ROUTES.account || accountRoute?.mode === "main") {
    return <SettingsTab onNotify={notify} />;
  }

  return <DashboardOverviewView />;
}
