"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useQuery, type QueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import type { DashboardQrItem } from "@/components/dashboard/qr/qr-mappers";
import { isMenuQrDetails, mapUserQrToDashboardItem } from "@/components/dashboard/qr/qr-mappers";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/dashboard/menu/SearchableSelect";
import { useDigitalMenuAccess } from "@/hooks/use-digital-menu-access";
import { useMenuByQr } from "@/hooks/use-menu-by-qr";
import {
  ApiError,
  getMyActiveMenusRequest,
  getUserQrsRequest,
  type ActiveMenuSummaryApiItem,
  type MenuProfileApiItem,
} from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

const STORAGE_KEY = "algory_selected_menu_qr_id";

export const MY_ACTIVE_MENUS_QUERY_KEY = ["myActiveMenus"] as const;

export type DigitalMenuSelection = {
  qr: DashboardQrItem;
  menu: MenuProfileApiItem;
};

function mapActiveMenuToDashboardItem(item: ActiveMenuSummaryApiItem): DashboardQrItem {
  const businessName = item.businessName?.trim() || undefined;
  const qrName = item.qr?.name?.trim() || undefined;
  return {
    id: item.qrId,
    userId: 0,
    name: qrName || businessName || `Menü #${item.qrId}`,
    content: item.publicUrl ?? "",
    scans: 0,
    created: "",
    type: "menu",
    active: item.active,
    imgSrc: null,
    details: {
      type: "menu",
      businessName: businessName ?? "",
      themeId: item.themeId ?? "",
      menuId: item.menuId,
    },
    menuId: item.menuId,
    publicUrl: item.publicUrl ?? undefined,
  };
}

export { useDigitalMenuAccess };

async function loadAllMenuQrs(): Promise<DashboardQrItem[]> {
  const qrs = await getUserQrsRequest("me", { includeImage: false, page: 0, size: 50 });
  return qrs.content
    .filter((qr) => isMenuQrDetails(qr.details ?? {}))
    .map(mapUserQrToDashboardItem);
}

export function useDigitalMenuOptions(enabled = true) {
  const query = useQuery({
    queryKey: MY_ACTIVE_MENUS_QUERY_KEY,
    queryFn: async (): Promise<DashboardQrItem[]> => {
      try {
        const items = await getMyActiveMenusRequest();
        if (items.length > 0) {
          return items.map(mapActiveMenuToDashboardItem);
        }
        // Aktif menü yoksa (pasif/eski menüler dahil) tüm menü QR'larını listele.
        return loadAllMenuQrs();
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 404) {
          throw error;
        }
        return loadAllMenuQrs();
      }
    },
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  return {
    menuQrs: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
  };
}

export function invalidateMyActiveMenus(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: MY_ACTIVE_MENUS_QUERY_KEY });
}

export function useDigitalMenuSelection(initialQrId?: number | null, enabled = true) {
  const { menuQrs, loading: optionsLoading } = useDigitalMenuOptions(enabled);
  const [preferredQrId, setPreferredQrId] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || optionsLoading) return;
    if (menuQrs.length === 0) {
      setPreferredQrId(null);
      return;
    }

    const stored =
      typeof window !== "undefined" ? Number(window.sessionStorage.getItem(STORAGE_KEY)) : NaN;
    const nextId =
      (initialQrId != null && menuQrs.some((item) => item.id === initialQrId) ? initialQrId : null) ??
      (preferredQrId != null && menuQrs.some((item) => item.id === preferredQrId)
        ? preferredQrId
        : null) ??
      (Number.isFinite(stored) && menuQrs.some((item) => item.id === stored) ? stored : null) ??
      menuQrs[0].id;

    if (nextId !== preferredQrId) {
      setPreferredQrId(nextId);
    }
  }, [enabled, initialQrId, menuQrs, optionsLoading, preferredQrId]);

  const selectQrId = useCallback(
    async (qrId: number) => {
      const qr = menuQrs.find((item) => item.id === qrId);
      if (!qr) return;
      setPreferredQrId(qr.id);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(STORAGE_KEY, String(qr.id));
      }
    },
    [menuQrs],
  );

  const menuQuery = useMenuByQr(preferredQrId, enabled && !optionsLoading && preferredQrId != null);
  const selectedQr = useMemo(
    () => (preferredQrId != null ? menuQrs.find((item) => item.id === preferredQrId) ?? null : null),
    [menuQrs, preferredQrId],
  );

  const selection = useMemo<DigitalMenuSelection | null>(() => {
    if (!selectedQr || !menuQuery.data) return null;
    return { qr: selectedQr, menu: menuQuery.data };
  }, [menuQuery.data, selectedQr]);

  useEffect(() => {
    if (menuQuery.data && preferredQrId != null && typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEY, String(preferredQrId));
    }
  }, [menuQuery.data, preferredQrId]);

  const error =
    preferredQrId != null && !selectedQr && !optionsLoading
      ? "Menü bulunamadı."
      : menuQuery.error instanceof Error
        ? menuQuery.error.message
        : menuQuery.isError
          ? "Menü yüklenemedi."
          : null;

  return {
    menuQrs,
    selection,
    loading: optionsLoading || (preferredQrId != null && menuQuery.isLoading),
    error,
    selectQrId,
  };
}

export function DigitalMenuPicker({
  menuQrs,
  selectedQrId,
  onSelectQrId,
  disabled,
  compact = false,
}: {
  menuQrs: DashboardQrItem[];
  selectedQrId: number | null;
  onSelectQrId: (qrId: number) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  if (menuQrs.length === 0) {
    return null;
  }

  return (
    <div className={compact ? "min-w-[12rem] max-w-xs flex-1" : "max-w-md space-y-1.5"}>
      {compact ? (
        <span className="sr-only">Menü seçin</span>
      ) : (
        <Label className="text-xs text-muted-foreground">Menü seçin</Label>
      )}
      <SearchableSelect
        className={compact ? "h-9 text-xs" : undefined}
        value={selectedQrId != null ? String(selectedQrId) : ""}
        onValueChange={(next) => {
          const id = Number(next);
          if (Number.isFinite(id) && id > 0) onSelectQrId(id);
        }}
        options={menuQrs.map((item) => ({ value: String(item.id), label: item.name }))}
        placeholder="Menü seçin"
        searchPlaceholder="Menü ara..."
        emptyText="Menü bulunamadı."
        disabled={disabled}
      />
    </div>
  );
}
