"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

import { useDigitalMenuAccess } from "@/components/dashboard/menu/DigitalMenuPicker";
import {
  MenuDetails,
  createInitialMenuData,
  type MenuData,
} from "@/components/dashboard/qr-create/MenuDetails";
import { resolveMenuThemeId } from "@/components/menu-templates/registry";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { invalidateMenuByQr, useMenuByQr } from "@/hooks/use-menu-by-qr";
import { ApiError, updateMenuRequest } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

type DigitalMenuSettingsViewProps = {
  qrId: number;
};

export default function DigitalMenuSettingsView({ qrId }: DigitalMenuSettingsViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const menuQuery = useMenuByQr(qrId);
  const [saving, setSaving] = useState(false);
  const [menu, setMenu] = useState<MenuData>(createInitialMenuData());
  const [menuHydratedFor, setMenuHydratedFor] = useState<number | null>(null);

  const profile = menuQuery.data ?? null;
  const menuId = profile?.menuId ?? null;

  useEffect(() => {
    if (!profile) return;
    if (menuHydratedFor === profile.menuId) return;
    const themeId = resolveMenuThemeId(profile.themeId);
    setMenu({
      businessName: profile.businessName ?? "",
      slogan: profile.slogan ?? "",
      phone: profile.phone ?? "",
      email: profile.email ?? "",
      address: profile.address ?? "",
      themeId,
      chefName: profile.chefName ?? "",
      chefAvatarKey: profile.chefAvatarKey ?? "default",
      logoUrl: profile.logoUrl ?? "",
    });
    setMenuHydratedFor(profile.menuId);
  }, [menuHydratedFor, profile]);

  useEffect(() => {
    if (menuQuery.isError) {
      notify(
        "danger",
        menuQuery.error instanceof ApiError ? menuQuery.error.message : "Menü yüklenemedi.",
      );
      router.push(DASHBOARD_ROUTES.digitalMenu);
    }
  }, [menuQuery.error, menuQuery.isError, notify, router]);

  const saveProfile = async () => {
    if (menuId == null) return;
    if (!menu.businessName.trim()) {
      notify("warning", "Firma adı zorunlu.");
      return;
    }
    setSaving(true);
    try {
      await updateMenuRequest(menuId, {
        businessName: menu.businessName.trim(),
        slogan: menu.slogan.trim(),
        phone: menu.phone.trim(),
        email: menu.email.trim(),
        address: menu.address.trim(),
        themeId: menu.themeId,
        chefName: menu.chefName.trim(),
        chefAvatarKey: menu.chefAvatarKey.trim() || "default",
      });
      await invalidateMenuByQr(queryClient, qrId);
      notify("info", "Menü bilgileri güncellendi.");
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Menü güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  if (accessLoading || menuQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!canUseDigitalMenu) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.push(DASHBOARD_ROUTES.digitalMenu)}>
          Dijital Menüye Dön
        </Button>
        <p className="text-sm text-muted-foreground">Menü ayarları için PRO paket gerekir.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(DASHBOARD_ROUTES.digitalMenuEdit(qrId))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Menü Ayarları</h1>
          <p className="text-sm text-muted-foreground">
            {profile?.businessName
              ? `${profile.businessName} · işletme, tema ve yayın`
              : "İşletme bilgileri, tema ve yayın ayarları"}
          </p>
        </div>
      </div>

      {menuId != null ? (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <Tabs defaultValue="info" className="space-y-5">
            <TabsList className="grid h-auto w-full grid-cols-2">
              <TabsTrigger value="info">Menü bilgileri</TabsTrigger>
              <TabsTrigger value="appearance">Görünüm</TabsTrigger>
            </TabsList>
            {(["info", "appearance"] as const).map((section) => (
              <TabsContent key={section} value={section} className="mt-0 space-y-5">
                <MenuDetails
                  value={menu}
                  onChange={setMenu}
                  excludeMenuId={menuId}
                  menuId={menuId}
                  section={section}
                  qrPreview={
                    profile
                      ? {
                          imgSrc: profile.qr?.imgSrc ?? null,
                          name: profile.qr?.name?.trim() || menu.businessName.trim() || "Menü QR",
                          content: profile.publicUrl,
                        }
                      : null
                  }
                />
                <div className="flex justify-end">
                  <Button type="button" disabled={saving} onClick={() => void saveProfile()}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kaydet"}
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      ) : null}
    </div>
  );
}
