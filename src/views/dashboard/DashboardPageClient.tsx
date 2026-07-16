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
    if (pathname === DASHBOARD_ROUTES.accountSubscription) {
      return { mode: "subscription" as const };
    }
    const checkoutPrefix = `${DASHBOARD_ROUTES.accountSubscription}/satin-al/`;
    if (pathname.startsWith(checkoutPrefix)) {
      const slug = pathname.slice(checkoutPrefix.length).split("/")[0];
      const packageId = Number(slug);
      if (slug && Number.isFinite(packageId)) {
        return { mode: "checkout" as const, packageId };
      }
    }
    if (pathname === DASHBOARD_ROUTES.account) {
      return { mode: "main" as const };
    }
    return null;
  }, [pathname]);

  if (pathname === DASHBOARD_ROUTES.overview || pathname === DASHBOARD_ROUTES.root) {
    return <DashboardOverviewView />;
  }

  if (pathname === DASHBOARD_ROUTES.analytics) {
    return <AnalyticsTab />;
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

  if (accountRoute?.mode === "subscription") {
    return (
      <Suspense fallback={null}>
        <SubscriptionSection onNotify={notify} />
      </Suspense>
    );
  }

  if (pathname === DASHBOARD_ROUTES.account || accountRoute?.mode === "main") {
    return <SettingsTab onNotify={notify} />;
  }

  return <DashboardOverviewView />;
}
