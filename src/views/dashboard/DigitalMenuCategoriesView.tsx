"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import MenuCategoriesPanel from "@/components/dashboard/menu/MenuCategoriesPanel";
import {
  DigitalMenuGate,
  DigitalMenuPicker,
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

export default function DigitalMenuCategoriesView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQrId = useMemo(() => {
    const raw = Number(searchParams.get("qr"));
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
  }, [searchParams]);
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const { menuQrs, selection, loading, error, selectQrId } = useDigitalMenuSelection(initialQrId);

  return (
    <DigitalMenuGate accessLoading={accessLoading} canUse={canUseDigitalMenu}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Kategoriler</h1>
          <p className="text-sm text-muted-foreground">
            Her menü için ana ve alt kategorileri oluşturun. Kategoriler yalnızca seçili firmaya aittir.
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
            Kategoriler hazırlanıyor…
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : selection ? (
          <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="text-sm font-medium text-foreground">{selection.menu.businessName}</h2>
              <p className="text-xs text-muted-foreground">Kategori ve alt kategori yönetimi</p>
            </div>
            <MenuCategoriesPanel
              menuId={selection.menu.menuId}
              onAddProduct={(categoryId) => {
                router.push(
                  `${DASHBOARD_ROUTES.digitalMenuProducts}?qr=${selection.qr.id}&category=${categoryId}`,
                );
              }}
            />
          </div>
        ) : null}
      </div>
    </DigitalMenuGate>
  );
}
