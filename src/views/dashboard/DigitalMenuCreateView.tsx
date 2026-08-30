"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, Loader2 } from "lucide-react";

import {
  DigitalMenuPicker,
  invalidateMyActiveMenus,
  useDigitalMenuAccess,
  useDigitalMenuOptions,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { MenuDetails, createInitialMenuData, type MenuData } from "@/components/dashboard/qr-create/MenuDetails";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { invalidateBranches, useBranches } from "@/hooks/use-branches";
import { invalidatePackageUsage } from "@/hooks/use-package-usage";
import { invalidateSubscription } from "@/hooks/use-subscription";
import { invalidateUserQrs } from "@/hooks/use-user-qrs";
import { ApiError, createQrRequest, getApiErrorCode, getMenuByQrIdRequest, getStoredUser } from "@/lib/api";
import {
  canCreateMenuOnBranch,
  formatBranchMenuQuota,
} from "@/lib/branch";
import Link from "next/link";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { buildMenuCreateDetails } from "@/lib/menu-create";
import type { MenuThemeId } from "@/components/menu-templates/registry";
import { DASHBOARD_BACK, DASHBOARD_PANEL } from "@/lib/dashboard-surface";

export default function DigitalMenuCreateView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const branchesQuery = useBranches(canUseDigitalMenu);
  const branchId = Number(searchParams.get("branch"));
  const selectedBranch = useMemo(
    () => branchesQuery.data?.content.find((item) => item.id === branchId) ?? null,
    [branchId, branchesQuery.data?.content],
  );
  const extraMenuQuotaLabel = formatBranchMenuQuota(branchesQuery.data?.menuQuota);
  const canCreateNewMenu = selectedBranch
    ? canCreateMenuOnBranch(selectedBranch, branchesQuery.data?.menuQuota)
    : false;
  const { menuQrs, loading: menusLoading } = useDigitalMenuOptions(canUseDigitalMenu);
  const [menu, setMenu] = useState<MenuData>(createInitialMenuData());
  const [copyFromExisting, setCopyFromExisting] = useState(false);
  const [sourceQrId, setSourceQrId] = useState<number | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!Number.isSafeInteger(branchId) || branchId <= 0) {
      router.replace(DASHBOARD_ROUTES.digitalMenu);
    }
  }, [branchId, router]);

  useEffect(() => {
    if (!selectedBranch || copyFromExisting) return;
    setMenu((current) => ({
      ...current,
      phone: current.phone || selectedBranch.phone || "",
      email: current.email || selectedBranch.email || "",
      address: current.address || selectedBranch.address || "",
    }));
  }, [copyFromExisting, selectedBranch]);

  useEffect(() => {
    if (!copyFromExisting) {
      setSourceQrId(null);
      return;
    }
    if (sourceQrId != null || menusLoading || menuQrs.length === 0) {
      return;
    }
    setSourceQrId(menuQrs[0]?.id ?? null);
  }, [copyFromExisting, menuQrs, menusLoading, sourceQrId]);

  useEffect(() => {
    if (!copyFromExisting || sourceQrId == null) {
      return;
    }

    let cancelled = false;
    setPrefillLoading(true);
    void (async () => {
      try {
        const profile = await getMenuByQrIdRequest(sourceQrId);
        if (cancelled) return;
        setMenu({
          businessName: profile.businessName?.trim() ?? "",
          slogan: profile.slogan?.trim() ?? "",
          phone: profile.phone?.trim() ?? "",
          email: profile.email?.trim() ?? "",
          address: profile.address?.trim() ?? "",
          themeId: (profile.themeId as MenuThemeId) || createInitialMenuData().themeId,
          chefName: profile.chefName?.trim() ?? "",
          chefAvatarKey: profile.chefAvatarKey?.trim() || "default",
          logoUrl: "",
        });
      } catch (error) {
        if (!cancelled) {
          notify("warning", error instanceof ApiError ? error.message : "Kaynak menü bilgileri yüklenemedi.");
        }
      } finally {
        if (!cancelled) {
          setPrefillLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [copyFromExisting, notify, sourceQrId]);

  const resolveSourceMenuId = (): number | undefined => {
    if (!copyFromExisting || sourceQrId == null) {
      return undefined;
    }
    const selected = menuQrs.find((item) => item.id === sourceQrId);
    const detailsMenuId = selected?.details?.menuId;
    return selected?.menuId ?? (typeof detailsMenuId === "number" ? detailsMenuId : undefined);
  };

  const submit = async () => {
    if (!canUseDigitalMenu) {
      notify("warning", "Menü QR oluşturmak için PRO paket gerekli.");
      return;
    }
    if (!Number.isSafeInteger(branchId) || branchId <= 0 || selectedBranch == null) {
      notify("warning", "Menü oluşturmak için bir şube seçin.");
      router.push(DASHBOARD_ROUTES.digitalMenu);
      return;
    }
    if (!canCreateNewMenu) {
      router.push(DASHBOARD_ROUTES.catalogProductCheckout("QR_MENU"));
      return;
    }
    if (!menu.businessName.trim()) {
      notify("warning", "Firma adı zorunlu.");
      return;
    }
    if (copyFromExisting && sourceQrId == null) {
      notify("warning", "Kopyalamak için bir kaynak menü seçin.");
      return;
    }
    const sourceMenuId = resolveSourceMenuId();
    if (copyFromExisting && sourceMenuId == null) {
      notify("warning", "Kaynak menü bulunamadı.");
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
            chefName: menu.chefName.trim() || undefined,
            chefAvatarKey: menu.chefAvatarKey.trim() || undefined,
          },
          [],
          { sourceMenuId, branchId },
        ),
      });
      await invalidatePackageUsage(queryClient);
      await invalidateSubscription(queryClient);
      await invalidateBranches(queryClient);
      const storedUser = getStoredUser();
      await Promise.all([
        invalidateUserQrs(queryClient, storedUser?.id != null ? String(storedUser.id) : "me"),
        invalidateMyActiveMenus(queryClient),
      ]);
      notify(
        "info",
        copyFromExisting
          ? "Dijital menünüz kaynak menüden kopyalanarak oluşturuldu."
          : "Dijital menü QR kodunuz oluşturuldu.",
      );
      if (response.qrId != null) {
        router.push(DASHBOARD_ROUTES.digitalMenuSettings(response.qrId));
      } else {
        router.push(DASHBOARD_ROUTES.digitalMenuMenus);
      }
    } catch (error) {
      if (getApiErrorCode(error) === "EXTRA_MENU_REQUIRED") {
        router.push(DASHBOARD_ROUTES.catalogProductCheckout("QR_MENU"));
        return;
      }
      notify("danger", error instanceof ApiError ? error.message : "Menü QR oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  };

  if (accessLoading || branchesQuery.isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <DashboardPageHeader title="Menü QR Oluştur" hint="İşletme bilgilerini girin." />
        <DashboardLoadingState label="Menü oluşturma ekranı hazırlanıyor…" />
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

  if (!selectedBranch) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Button variant="outline" onClick={() => router.push(DASHBOARD_ROUTES.digitalMenu)}>
          Şubelere dön
        </Button>
        <p className="text-sm text-muted-foreground">Menü oluşturmak için geçerli bir şube seçin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardPageHeader
        title="Menü QR Oluştur"
        hint={
          extraMenuQuotaLabel
            ? `${selectedBranch.name} şubesi için işletme bilgilerini girin. · ${extraMenuQuotaLabel}`
            : `${selectedBranch.name} şubesi için işletme bilgilerini girin.`
        }
        back={
          <Link href={DASHBOARD_ROUTES.digitalMenu} aria-label="Menüye dön" className={DASHBOARD_BACK}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

      {menuQrs.length > 0 ? (
        <div className={`${DASHBOARD_PANEL} space-y-4`}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Copy className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-base font-semibold text-foreground">Mevcut menüden kopyala</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Aktif menülerinizden birini seçerek ürün ve kategori içeriğini yeni menüye aktarın.
              </p>
            </div>
            <Switch
              checked={copyFromExisting}
              onCheckedChange={(checked) => {
                setCopyFromExisting(checked);
                if (!checked) {
                  setMenu(createInitialMenuData());
                }
              }}
              disabled={menusLoading || saving}
              aria-label="Mevcut menüden kopyala"
            />
          </div>

          {copyFromExisting ? (
            <div className="space-y-3 border-t border-border pt-4">
              <DigitalMenuPicker
                menuQrs={menuQrs}
                selectedQrId={sourceQrId}
                onSelectQrId={setSourceQrId}
                disabled={menusLoading || prefillLoading || saving}
              />
              {prefillLoading ? (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Kaynak menü bilgileri yükleniyor...
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  İşletme bilgileri kaynak menüden doldurulur; düzenleyebilirsiniz. Ürünler oluşturma sırasında kopyalanır.
                </p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={`${DASHBOARD_PANEL} space-y-5`}>
        <h2 className="text-base font-semibold text-foreground">İşletme Bilgileri</h2>
        <MenuDetails value={menu} onChange={setMenu} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push(DASHBOARD_ROUTES.digitalMenu)}>
          Vazgeç
        </Button>
        <Button type="button" variant="hero" disabled={saving || prefillLoading || !canCreateNewMenu} onClick={() => void submit()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Menü QR Oluştur"}
        </Button>
      </div>
    </div>
  );
}
