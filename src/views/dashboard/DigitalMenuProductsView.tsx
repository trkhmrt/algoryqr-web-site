"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import {
  DigitalMenuPicker,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import MenuProductsPanel from "@/components/dashboard/menu/MenuProductsPanel";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { DASHBOARD_BACK, DASHBOARD_PANEL } from "@/lib/dashboard-surface";

export default function DigitalMenuProductsView() {
  const searchParams = useSearchParams();
  const initialQrId = useMemo(() => {
    const raw = Number(searchParams.get("qr"));
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
  }, [searchParams]);
  const presetCategoryId = useMemo(() => {
    const raw = Number(searchParams.get("category"));
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
  }, [searchParams]);
  const fromHub = initialQrId != null;
  const selectionState = useDigitalMenuSelection(undefined, !fromHub);
  const qrId = fromHub ? initialQrId : selectionState.selection?.qr.id ?? null;
  const menuId = fromHub ? null : selectionState.selection?.menu.menuId ?? null;

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardPageHeader
        title="Ürünler"
        hint="Ürünleri seçili menüye ekleyin ve kategorilere bağlayın."
        back={
          fromHub ? (
            <Link
              href={DASHBOARD_ROUTES.digitalMenuEdit(initialQrId!)}
              aria-label="Menü editörüne dön"
              className={DASHBOARD_BACK}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          ) : undefined
        }
      />

        {!fromHub ? (
          <DigitalMenuPicker
            menuQrs={selectionState.menuQrs}
            selectedQrId={selectionState.selection?.qr.id ?? null}
            onSelectQrId={(id) => void selectionState.selectQrId(id)}
            disabled={selectionState.loading}
          />
        ) : null}

        {qrId != null ? (
          <div className={DASHBOARD_PANEL}>
            <MenuProductsPanel
              menuId={menuId ?? 0}
              qrId={qrId}
              presetCategoryId={presetCategoryId}
            />
          </div>
        ) : selectionState.loading ? (
          <DashboardLoadingState label="Menü bilgisi yükleniyor..." />
        ) : selectionState.error ? (
          <p className="text-sm text-destructive">{selectionState.error}</p>
        ) : null}
    </div>
  );
}
