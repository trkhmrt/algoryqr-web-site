"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type DashboardBannerType = "info" | "warning" | "danger";

export type DashboardBanner = {
  id: string;
  type: DashboardBannerType;
  message: string;
};

type DashboardBannersContextValue = {
  notify: (type: DashboardBannerType, message: string) => void;
};

const DashboardBannersContext = createContext<DashboardBannersContextValue | null>(null);

export function DashboardBannersProvider({
  children,
  onBanner,
}: {
  children: ReactNode;
  onBanner: (banner: DashboardBanner) => void;
}) {
  const notify = useCallback(
    (type: DashboardBannerType, message: string) => {
      onBanner({ id: Date.now().toString(), type, message });
    },
    [onBanner],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return <DashboardBannersContext.Provider value={value}>{children}</DashboardBannersContext.Provider>;
}

export function useDashboardBanners() {
  const ctx = useContext(DashboardBannersContext);
  if (!ctx) {
    throw new Error("useDashboardBanners must be used within DashboardBannersProvider");
  }
  return ctx;
}

export function useDashboardBannerState() {
  const [banners, setBanners] = useState<DashboardBanner[]>([]);

  const addBanner = useCallback((banner: DashboardBanner) => {
    setBanners((prev) => [...prev, banner]);
    setTimeout(() => {
      setBanners((prev) => prev.filter((b) => b.id !== banner.id));
    }, banner.type === "danger" ? 5000 : 4000);
  }, []);

  const removeBanner = useCallback((id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return { banners, addBanner, removeBanner };
}
