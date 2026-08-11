"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";

import { useDigitalMenuAccess } from "@/components/dashboard/menu/DigitalMenuPicker";
import {
  MenuDetails,
  createInitialMenuData,
  type MenuData,
} from "@/components/dashboard/qr-create/MenuDetails";
import { resolveMenuThemeId } from "@/components/menu-templates/registry";
import { Button } from "@/components/ui/button";
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
  const imgSrc = profile?.qr?.imgSrc ?? null;
  const publicUrl = profile?.publicUrl ?? null;

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
        {publicUrl ? (
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href={publicUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              Aç
            </a>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {menuId != null ? (
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <div className="space-y-5">
                <MenuDetails value={menu} onChange={setMenu} excludeMenuId={menuId} menuId={menuId} />
                <div className="flex justify-end">
                  <Button type="button" disabled={saving} onClick={() => void saveProfile()}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kaydet"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 lg:p-6">
          <h2 className="mb-3 text-sm font-medium text-foreground lg:mb-4">QR Kod</h2>
          <div className="flex flex-col items-center gap-3">
            <div className="flex aspect-square w-full max-w-[14rem] items-center justify-center overflow-hidden rounded-lg bg-muted">
              {imgSrc ? (
                <img
                  src={`data:image/png;base64,${imgSrc}`}
                  alt={profile?.qr?.name || "Menü QR"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <p className="px-4 text-center text-xs text-muted-foreground">
                  QR görseli bulunamadı.
                </p>
              )}
            </div>
            {profile?.qr?.name ? (
              <p className="text-sm font-medium text-foreground">{profile.qr.name}</p>
            ) : null}
            {publicUrl ? (
              <p className="break-all text-center text-xs text-muted-foreground">{publicUrl}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
