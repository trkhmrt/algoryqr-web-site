"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import {
  DigitalMenuGate,
  DigitalMenuPicker,
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import MenuProductsPanel from "@/components/dashboard/menu/MenuProductsPanel";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

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
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const fromHub = initialQrId != null;
  const selectionState = useDigitalMenuSelection(undefined, !fromHub);
  const qrId = fromHub ? initialQrId : selectionState.selection?.qr.id ?? null;
  const menuId = fromHub ? null : selectionState.selection?.menu.menuId ?? null;

  return (
    <DigitalMenuGate accessLoading={accessLoading} canUse={canUseDigitalMenu}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-start gap-3">
          {fromHub ? (
            <Link
              href={DASHBOARD_ROUTES.digitalMenuEdit(initialQrId)}
              className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          ) : null}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ürünler</h1>
            <p className="text-sm text-muted-foreground">
              Ürünleri seçili menüye ekleyin ve kategorilere bağlayın.
            </p>
          </div>
        </div>

        {!fromHub ? (
          <DigitalMenuPicker
            menuQrs={selectionState.menuQrs}
            selectedQrId={selectionState.selection?.qr.id ?? null}
            onSelectQrId={(id) => void selectionState.selectQrId(id)}
            disabled={selectionState.loading}
          />
        ) : null}

        {qrId != null ? (
          <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
            <MenuProductsPanel
              menuId={menuId ?? 0}
              qrId={qrId}
              presetCategoryId={presetCategoryId}
            />
          </div>
        ) : selectionState.loading ? null : selectionState.error ? (
          <p className="text-sm text-destructive">{selectionState.error}</p>
        ) : null}
      </div>
    </DigitalMenuGate>
  );
}
