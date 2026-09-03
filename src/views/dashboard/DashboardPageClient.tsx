"use client";

import { Suspense, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import AnalyticsTab from "@/components/dashboard/AnalyticsTab";
import { PackageComparisonPageSkeleton } from "@/components/dashboard/PackageComparisonSkeleton";
import PackagePurchaseView from "@/components/dashboard/PackagePurchaseView";
import ProductPurchaseView from "@/components/dashboard/ProductPurchaseView";
import SettingsTab from "@/components/dashboard/SettingsTab";
import SubscriptionSection from "@/components/dashboard/SubscriptionSection";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { prefetchActivePackages } from "@/hooks/use-subscription";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import type { StoredUser } from "@/lib/api";
import DashboardOverviewView from "@/views/dashboard/DashboardOverviewView";
import DashboardQrCodesView from "@/views/dashboard/DashboardQrCodesView";
import AccountSessionsView from "@/views/dashboard/AccountSessionsView";
import AccountSessionsDetailView from "@/views/dashboard/AccountSessionsDetailView";
import BillingAddressesView from "@/views/dashboard/BillingAddressesView";
import BranchCreateView from "@/views/dashboard/BranchCreateView";
import BranchSettingsView from "@/views/dashboard/BranchSettingsView";
import DigitalMenuView from "@/views/dashboard/DigitalMenuView";
import DigitalMenuMenusView from "@/views/dashboard/DigitalMenuMenusView";
import OrderPanelView from "@/views/dashboard/OrderPanelView";
import DigitalMenuCreateView from "@/views/dashboard/DigitalMenuCreateView";
import DigitalMenuEditorView from "@/views/dashboard/DigitalMenuEditorView";
import DigitalMenuSettingsView from "@/views/dashboard/DigitalMenuSettingsView";
import DigitalMenuProductsView from "@/views/dashboard/DigitalMenuProductsView";
import DigitalMenuProductCreateView from "@/views/dashboard/DigitalMenuProductCreateView";
import DigitalMenuProductDetailView from "@/views/dashboard/DigitalMenuProductDetailView";
import DigitalMenuCategoriesView from "@/views/dashboard/DigitalMenuCategoriesView";
import PackageComparisonView from "@/views/dashboard/PackageComparisonView";
import PaymentHistoryDetailView from "@/views/dashboard/PaymentHistoryDetailView";
import PaymentHistoryView from "@/views/dashboard/PaymentHistoryView";
import PaymentMethodsView from "@/views/dashboard/PaymentMethodsView";
import PlanChangeView from "@/views/dashboard/PlanChangeView";
import PurchaseDetailView from "@/views/dashboard/PurchaseDetailView";
import TrialStartView from "@/views/dashboard/TrialStartView";
import FeedbackView from "@/views/dashboard/FeedbackView";
import ReservationsView from "@/views/dashboard/ReservationsView";
import TrendyolGoHubView from "@/views/dashboard/TrendyolGoHubView";
import TrendyolGoOrdersView from "@/views/dashboard/TrendyolGoOrdersView";
import TrendyolGoProductsView from "@/views/dashboard/TrendyolGoProductsView";
import UberEatsHubView from "@/views/dashboard/UberEatsHubView";
import UberEatsPendingView from "@/views/dashboard/UberEatsPendingView";
import IntegrationsHubView from "@/views/dashboard/IntegrationsHubView";
import YemekSepetiHubView from "@/views/dashboard/YemekSepetiHubView";
import RestaurantLayoutView from "@/views/dashboard/RestaurantLayoutView";
import SmartReportDetailView from "@/views/dashboard/SmartReportDetailView";
import SmartReportsView from "@/views/dashboard/SmartReportsView";
import ReportsHubView from "@/views/dashboard/ReportsHubView";
import MenuCustomersView from "@/views/dashboard/MenuCustomersView";
import CampaignsView from "@/views/dashboard/CampaignsView";
import CampaignCreateView from "@/views/dashboard/CampaignCreateView";
import CampaignDetailView from "@/views/dashboard/CampaignDetailView";
import MenuUserDetailView from "@/views/dashboard/MenuUserDetailView";
import MenuUsersView from "@/views/dashboard/MenuUsersView";
import WaiterOrdersView from "@/views/dashboard/WaiterOrdersView";
import AccountingView from "@/views/dashboard/AccountingView";

interface DashboardPageClientProps {
  initialUser?: StoredUser | null;
}

export default function DashboardPageClient({ initialUser = null }: DashboardPageClientProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();

  useEffect(() => {
    if (pathname.startsWith(`${DASHBOARD_ROUTES.account}/`)) {
      void prefetchActivePackages(queryClient);
    }
  }, [pathname, queryClient]);

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
    if (pathname === DASHBOARD_ROUTES.accountSessionsDetail) {
      return { mode: "sessionsDetail" as const };
    }
    if (pathname === DASHBOARD_ROUTES.accountSessions) {
      return { mode: "sessions" as const };
    }
    if (pathname === DASHBOARD_ROUTES.accountPaymentHistory) {
      return { mode: "paymentHistory" as const };
    }
    const paymentHistoryDetailPrefix = `${DASHBOARD_ROUTES.accountPaymentHistory}/`;
    if (pathname.startsWith(paymentHistoryDetailPrefix)) {
      const slug = pathname.slice(paymentHistoryDetailPrefix.length).split("/")[0];
      const purchaseId = Number(slug);
      if (slug && Number.isSafeInteger(purchaseId) && purchaseId > 0) {
        return { mode: "paymentHistoryDetail" as const, purchaseId };
      }
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
    if (pathname === DASHBOARD_ROUTES.accountSecurity) {
      return { mode: "security" as const };
    }
    if (pathname === DASHBOARD_ROUTES.account) {
      return { mode: "main" as const };
    }
    return null;
  }, [pathname]);

  const catalogProductCheckout = useMemo(() => {
    const prefix = `${DASHBOARD_ROUTES.digitalMenu}/urun-satin-al/`;
    if (!pathname.startsWith(prefix)) return null;
    const code = decodeURIComponent(pathname.slice(prefix.length).split("/")[0] ?? "");
    return code === "QR_BRANCH" || code === "QR_MENU" ? code : null;
  }, [pathname]);

  const branchSettingsId = useMemo(() => {
    const prefix = `${DASHBOARD_ROUTES.digitalMenu}/subeler/`;
    if (!pathname.startsWith(prefix)) return null;
    const [idSlug, settingsSlug] = pathname.slice(prefix.length).split("/");
    if (settingsSlug !== "ayarlar") return null;
    const branchId = Number(idSlug);
    return Number.isSafeInteger(branchId) && branchId > 0 ? branchId : null;
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

  if (pathname === DASHBOARD_ROUTES.trialStart) {
    return (
      <Suspense fallback={null}>
        <TrialStartView />
      </Suspense>
    );
  }

  if (pathname === DASHBOARD_ROUTES.reportsHub) {
    return <ReportsHubView />;
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

  if (pathname === DASHBOARD_ROUTES.smartReports) {
    return <SmartReportsView />;
  }

  if (pathname === DASHBOARD_ROUTES.feedback) {
    return (
      <Suspense fallback={null}>
        <FeedbackView />
      </Suspense>
    );
  }

  if (pathname === DASHBOARD_ROUTES.reservations) {
    return (
      <Suspense fallback={null}>
        <ReservationsView />
      </Suspense>
    );
  }

  if (pathname === DASHBOARD_ROUTES.integrations) {
    return <IntegrationsHubView />;
  }

  if (pathname === DASHBOARD_ROUTES.yemekSepeti) {
    return <YemekSepetiHubView />;
  }

  if (pathname === DASHBOARD_ROUTES.uberEats) {
    return <UberEatsHubView />;
  }

  if (pathname === DASHBOARD_ROUTES.uberEatsPending) {
    return <UberEatsPendingView />;
  }

  if (pathname === DASHBOARD_ROUTES.trendyolGo) {
    return <TrendyolGoHubView />;
  }

  if (pathname === DASHBOARD_ROUTES.trendyolGoProducts) {
    return <TrendyolGoProductsView />;
  }

  if (pathname === DASHBOARD_ROUTES.trendyolGoOrders) {
    return <TrendyolGoOrdersView />;
  }

  if (pathname === DASHBOARD_ROUTES.restaurantLayout) {
    return (
      <Suspense fallback={null}>
        <RestaurantLayoutView />
      </Suspense>
    );
  }

  if (pathname === DASHBOARD_ROUTES.muhasebe) {
    return (
      <Suspense fallback={null}>
        <AccountingView />
      </Suspense>
    );
  }

  if (pathname === DASHBOARD_ROUTES.orderPanel) {
    return <OrderPanelView />;
  }

  if (pathname === DASHBOARD_ROUTES.orderPanelReports) {
    return (
      <Suspense fallback={null}>
        <AnalyticsTab variant="orders" />
      </Suspense>
    );
  }

  if (pathname === DASHBOARD_ROUTES.waiter) {
    return (
      <Suspense fallback={null}>
        <WaiterOrdersView />
      </Suspense>
    );
  }

  const menuUserDetailPrefix = `${DASHBOARD_ROUTES.menuUsers}/`;
  if (pathname.startsWith(menuUserDetailPrefix)) {
    const waiterId = Number(pathname.slice(menuUserDetailPrefix.length).split("/")[0]);
    if (Number.isSafeInteger(waiterId) && waiterId > 0) {
      return (
        <Suspense fallback={null}>
          <MenuUserDetailView waiterId={waiterId} />
        </Suspense>
      );
    }
  }

  if (pathname === DASHBOARD_ROUTES.menuUsers) {
    return (
      <Suspense fallback={null}>
        <MenuUsersView />
      </Suspense>
    );
  }

  if (pathname === DASHBOARD_ROUTES.menuCustomers) {
    return (
      <Suspense fallback={null}>
        <MenuCustomersView />
      </Suspense>
    );
  }

  if (pathname === DASHBOARD_ROUTES.campaigns) {
    return (
      <Suspense fallback={null}>
        <CampaignsView />
      </Suspense>
    );
  }

  if (pathname === DASHBOARD_ROUTES.campaignsCreate) {
    return (
      <Suspense fallback={null}>
        <CampaignCreateView />
      </Suspense>
    );
  }

  const campaignDetailPrefix = `${DASHBOARD_ROUTES.campaigns}/`;
  if (pathname.startsWith(campaignDetailPrefix) && pathname !== DASHBOARD_ROUTES.campaignsCreate) {
    const slug = pathname.slice(campaignDetailPrefix.length).split("/")[0];
    const id = Number(slug);
    if (slug && Number.isFinite(id) && id > 0) {
      return (
        <Suspense fallback={null}>
          <CampaignDetailView />
        </Suspense>
      );
    }
  }

  const smartReportDetailPrefix = `${DASHBOARD_ROUTES.smartReports}/`;
  if (pathname.startsWith(smartReportDetailPrefix)) {
    const jobId = pathname.slice(smartReportDetailPrefix.length).split("/")[0];
    if (jobId && /^[0-9a-fA-F-]{36}$/.test(jobId)) {
      return <SmartReportDetailView jobId={jobId} />;
    }
  }

  if (catalogProductCheckout) {
    return <ProductPurchaseView productCode={catalogProductCheckout} onNotify={notify} />;
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

  if (pathname === DASHBOARD_ROUTES.branchCreate) {
    return <BranchCreateView />;
  }

  if (branchSettingsId != null) {
    return <BranchSettingsView branchId={branchSettingsId} />;
  }

  if (pathname === DASHBOARD_ROUTES.digitalMenuCreate) {
    return (
      <Suspense fallback={null}>
        <DigitalMenuCreateView />
      </Suspense>
    );
  }

  if (pathname === DASHBOARD_ROUTES.digitalMenuProductCreate) {
    return (
      <Suspense fallback={null}>
        <DigitalMenuProductCreateView />
      </Suspense>
    );
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

  if (pathname === DASHBOARD_ROUTES.digitalMenuMenus) {
    return <DigitalMenuMenusView />;
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
      <Suspense fallback={<PackageComparisonPageSkeleton />}>
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

  if (accountRoute?.mode === "sessions") {
    return <AccountSessionsView />;
  }

  if (accountRoute?.mode === "sessionsDetail") {
    return <AccountSessionsDetailView />;
  }

  if (accountRoute?.mode === "paymentHistory") {
    return <PaymentHistoryView />;
  }

  if (accountRoute?.mode === "paymentHistoryDetail") {
    return <PaymentHistoryDetailView purchaseId={accountRoute.purchaseId} />;
  }

  if (accountRoute?.mode === "security" || pathname === DASHBOARD_ROUTES.account || accountRoute?.mode === "main") {
    return <SettingsTab onNotify={notify} />;
  }

  return <DashboardOverviewView />;
}
