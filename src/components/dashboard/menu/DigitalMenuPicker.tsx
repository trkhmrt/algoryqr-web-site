"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { isMenuQrDetails, type DashboardQrItem } from "@/components/dashboard/qr/qr-mappers";
import { Label } from "@/components/ui/label";
import { invalidateAccessProfile, useAccessProfile } from "@/hooks/use-access-profile";
import { useTrialStatus } from "@/hooks/use-commerce";
import { invalidateSubscription, useSubscription } from "@/hooks/use-subscription";
import { useUserQrs } from "@/hooks/use-user-qrs";
import { getMenuByQrIdRequest, type MenuProfileApiItem } from "@/lib/api";
import { hasProduct, hasScope } from "@/lib/auth-user";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { hasActiveProductAccess, hasExpiredProductAccess } from "@/lib/product-access";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";

const STORAGE_KEY = "algory_selected_menu_qr_id";

export type DigitalMenuSelection = {
  qr: DashboardQrItem;
  menu: MenuProfileApiItem;
};

export function useDigitalMenuAccess() {
  const queryClient = useQueryClient();
  const { data: accessProfile, isLoading: accessLoading } = useAccessProfile();
  const subscription = useSubscription();
  const trial = useTrialStatus();
  const entitlements = Array.isArray(subscription.data?.entitlements)
    ? subscription.data.entitlements
    : [];
  const purchases = Array.isArray(subscription.data?.purchases) ? subscription.data.purchases : [];
  const entitlementAccess = hasActiveProductAccess(entitlements, purchases, "QR_MENU");
  const scopeAccess = hasScope(accessProfile, "QR_MENU_OWNER");
  const productAccess = hasProduct(accessProfile, "QR_MENU");
  const trialAccess = trial.data?.status === "ACTIVE";
  const canUseDigitalMenu =
    entitlementAccess || scopeAccess || productAccess || trialAccess;
  const hadExpiredAccess =
    !canUseDigitalMenu &&
    (hasExpiredProductAccess(entitlements, purchases, "QR_MENU") ||
      trial.data?.status === "TRIAL_EXPIRED");
  const needsTokenRefresh =
    (entitlementAccess || trialAccess || productAccess) && !scopeAccess;

  useEffect(() => {
    if (!needsTokenRefresh || subscription.isLoading || accessLoading || trial.isLoading) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await getSiteSameOriginAxios().post("/auth/refresh");
        if (!cancelled) {
          await Promise.all([
            invalidateAccessProfile(queryClient),
            invalidateSubscription(queryClient),
          ]);
        }
      } catch {
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    accessLoading,
    needsTokenRefresh,
    queryClient,
    subscription.isLoading,
    trial.isLoading,
  ]);

  return {
    accessLoading: accessLoading || subscription.isLoading || trial.isLoading,
    canUseDigitalMenu,
    hadExpiredAccess,
  };
}

export function useDigitalMenuOptions() {
  const qrsQuery = useUserQrs("me");
  const menuQrs = useMemo(
    () => (qrsQuery.data ?? []).filter((item) => isMenuQrDetails(item.details)),
    [qrsQuery.data],
  );
  return { menuQrs, loading: qrsQuery.isLoading || qrsQuery.isFetching };
}

export function useDigitalMenuSelection(initialQrId?: number | null) {
  const { menuQrs, loading: optionsLoading } = useDigitalMenuOptions();
  const [selection, setSelection] = useState<DigitalMenuSelection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastResolvedId = useRef<number | null>(null);

  const selectQrId = useCallback(
    async (qrId: number) => {
      const qr = menuQrs.find((item) => item.id === qrId);
      if (!qr) {
        setSelection(null);
        setError("Menü bulunamadı.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const menu = await getMenuByQrIdRequest(qr.id);
        setSelection({ qr, menu });
        lastResolvedId.current = qr.id;
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(STORAGE_KEY, String(qr.id));
        }
      } catch (err) {
        setSelection(null);
        setError(err instanceof Error ? err.message : "Menü yüklenemedi.");
      } finally {
        setLoading(false);
      }
    },
    [menuQrs],
  );

  useEffect(() => {
    if (optionsLoading) return;
    if (menuQrs.length === 0) {
      setSelection(null);
      setLoading(false);
      lastResolvedId.current = null;
      return;
    }

    const stored =
      typeof window !== "undefined" ? Number(window.sessionStorage.getItem(STORAGE_KEY)) : NaN;
    const preferredId =
      (initialQrId != null && menuQrs.some((item) => item.id === initialQrId) ? initialQrId : null) ??
      (lastResolvedId.current != null && menuQrs.some((item) => item.id === lastResolvedId.current)
        ? lastResolvedId.current
        : null) ??
      (Number.isFinite(stored) && menuQrs.some((item) => item.id === stored) ? stored : null) ??
      menuQrs[0].id;

    if (lastResolvedId.current === preferredId) {
      setLoading(false);
      return;
    }
    void selectQrId(preferredId);
  }, [initialQrId, menuQrs, optionsLoading, selectQrId]);

  return {
    menuQrs,
    selection,
    loading: optionsLoading || loading,
    error,
    selectQrId,
  };
}

export function DigitalMenuPicker({
  menuQrs,
  selectedQrId,
  onSelectQrId,
  disabled,
}: {
  menuQrs: DashboardQrItem[];
  selectedQrId: number | null;
  onSelectQrId: (qrId: number) => void;
  disabled?: boolean;
}) {
  if (menuQrs.length === 0) {
    return null;
  }

  return (
    <div className="max-w-md space-y-1.5">
      <Label className="text-xs text-muted-foreground">Menü seçin</Label>
      <select
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={selectedQrId ?? ""}
        disabled={disabled}
        onChange={(event) => onSelectQrId(Number(event.target.value))}
      >
        {menuQrs.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DigitalMenuGate({
  accessLoading,
  canUse,
  children,
}: {
  accessLoading: boolean;
  canUse: boolean;
  children: ReactNode;
}) {
  if (accessLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (!canUse) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Bu bölüm için Dijital Menü PRO gerekir.</p>
        <Link
          href={DASHBOARD_ROUTES.digitalMenu}
          className="inline-flex text-sm font-medium text-foreground underline-offset-2 hover:underline"
        >
          Dijital Menüye dön
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
