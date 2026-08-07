"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

import { invalidateMyActiveMenus, useDigitalMenuAccess } from "@/components/dashboard/menu/DigitalMenuPicker";
import { MenuDetails, createInitialMenuData, type MenuData } from "@/components/dashboard/qr-create/MenuDetails";
import { Button } from "@/components/ui/button";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { invalidatePackageUsage } from "@/hooks/use-package-usage";
import { invalidateUserQrs } from "@/hooks/use-user-qrs";
import { ApiError, createQrRequest, getStoredUser } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { buildMenuCreateDetails } from "@/lib/menu-create";

export default function DigitalMenuCreateView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const [menu, setMenu] = useState<MenuData>(createInitialMenuData());
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!canUseDigitalMenu) {
      notify("warning", "Menü QR oluşturmak için PRO paket gerekli.");
      return;
    }
    if (!menu.businessName.trim()) {
      notify("warning", "Firma adı zorunlu.");
      return;
    }

    setSaving(true);
    try {
      const response = await createQrRequest({
        qrName: menu.businessName.trim(),
        type: "menu",
        details: buildMenuCreateDetails(
          {
            businessName: menu.businessName.trim(),
            slogan: menu.slogan.trim() || undefined,
            phone: menu.phone.trim() || undefined,
            email: menu.email.trim() || undefined,
            address: menu.address.trim() || undefined,
            themeId: menu.themeId,
          },
          [],
        ),
      });
      await invalidatePackageUsage(queryClient);
      const storedUser = getStoredUser();
      await Promise.all([
        invalidateUserQrs(queryClient, storedUser?.id != null ? String(storedUser.id) : "me"),
        invalidateMyActiveMenus(queryClient),
      ]);
      notify("info", "Dijital menü QR kodunuz oluşturuldu.");
      if (response.qrId != null) {
        router.push(DASHBOARD_ROUTES.digitalMenuEdit(response.qrId));
      } else {
        router.push(DASHBOARD_ROUTES.digitalMenu);
      }
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Menü QR oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  };

  if (accessLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!canUseDigitalMenu) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Button variant="outline" onClick={() => router.push(DASHBOARD_ROUTES.digitalMenu)}>
          Dijital Menüye Dön
        </Button>
        <p className="text-sm text-muted-foreground">Menü QR oluşturmak için PRO paket veya aktif deneme gerekir.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(DASHBOARD_ROUTES.digitalMenu)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Menü QR Oluştur</h1>
          <p className="text-sm text-muted-foreground">
            İşletme bilgilerini girin. Ürün ve kategorileri menü oluşturulduktan sonra ekleyebilirsiniz.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-5">
        <h2 className="text-sm font-medium text-foreground">İşletme Bilgileri</h2>
        <MenuDetails value={menu} onChange={setMenu} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push(DASHBOARD_ROUTES.digitalMenu)}>
          Vazgeç
        </Button>
        <Button type="button" variant="hero" disabled={saving} onClick={() => void submit()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Menü QR Oluştur"}
        </Button>
      </div>
    </div>
  );
}
