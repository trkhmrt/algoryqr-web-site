"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import {
  DigitalMenuGate,
  DigitalMenuPicker,
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import MenuProductsPanel from "@/components/dashboard/menu/MenuProductsPanel";

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
  const { menuQrs, selection, loading, error, selectQrId } = useDigitalMenuSelection(initialQrId);

  return (
    <DigitalMenuGate accessLoading={accessLoading} canUse={canUseDigitalMenu}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ürünler</h1>
          <p className="text-sm text-muted-foreground">
            Ürünleri seçili menüye ekleyin ve kategorilere bağlayın.
          </p>
        </div>

        <DigitalMenuPicker
          menuQrs={menuQrs}
          selectedQrId={selection?.qr.id ?? null}
          onSelectQrId={(qrId) => void selectQrId(qrId)}
          disabled={loading}
        />

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Ürünler hazırlanıyor…
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : selection ? (
          <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="text-sm font-medium text-foreground">{selection.menu.businessName}</h2>
              <p className="text-xs text-muted-foreground">Ürün listesi ve düzenleme</p>
            </div>
            <MenuProductsPanel menuId={selection.menu.menuId} presetCategoryId={presetCategoryId} />
          </div>
        ) : null}
      </div>
    </DigitalMenuGate>
  );
}
