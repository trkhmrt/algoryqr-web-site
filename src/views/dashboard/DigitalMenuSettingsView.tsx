"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";

import { useDigitalMenuAccess } from "@/components/dashboard/menu/DigitalMenuPicker";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import {
  MenuDetails,
  createInitialMenuData,
  type MenuData,
} from "@/components/dashboard/qr-create/MenuDetails";
import { resolveMenuThemeId } from "@/components/menu-templates/registry";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { invalidateMenuByQr, useMenuByQr } from "@/hooks/use-menu-by-qr";
import { invalidatePackageUsage } from "@/hooks/use-package-usage";
import { invalidateSubscription } from "@/hooks/use-subscription";
import { ApiError, deleteMenuRequest, updateMenuRequest } from "@/lib/api";
import Link from "next/link";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { refreshAccessAfterEntitlementChange } from "@/lib/refresh-access";
import { DASHBOARD_BACK, DASHBOARD_PANEL, DASHBOARD_SURFACE } from "@/lib/dashboard-surface";

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
  const [deleting, setDeleting] = useState(false);
  const [menu, setMenu] = useState<MenuData>(createInitialMenuData());
  const [menuHydratedFor, setMenuHydratedFor] = useState<number | null>(null);

  const profile = menuQuery.data ?? null;
  const menuId = profile?.menuId ?? null;

  useEffect(() => {
    if (!profile) return;
    if (menuHydratedFor === (profile.menuId ?? null)) return;
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
    setMenuHydratedFor(profile.menuId ?? null);
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

  const handleDeleteMenu = async () => {
    if (menuId == null) return;
    setDeleting(true);
    try {
      await deleteMenuRequest(menuId);
      await refreshAccessAfterEntitlementChange(queryClient);
      await invalidatePackageUsage(queryClient);
      await invalidateSubscription(queryClient);
      notify("info", `"${profile?.businessName ?? "Menü"}" silindi.`);
      router.push(DASHBOARD_ROUTES.digitalMenu);
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Menü silinemedi.");
    } finally {
      setDeleting(false);
    }
  };

  if (accessLoading || menuQuery.isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <DashboardPageHeader
          title="Menü Ayarları"
          hint="İşletme bilgileri, tema ve yayın ayarları"
          back={
            <Link
              href={DASHBOARD_ROUTES.digitalMenuEdit(qrId)}
              aria-label="Menü düzenleyiciye dön"
              className={DASHBOARD_BACK}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          }
        />
        <DashboardLoadingState label="Menü ayarları yükleniyor…" />
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
      <DashboardPageHeader
        title="Menü Ayarları"
        hint={
          profile?.businessName
            ? `${profile.businessName} · işletme, tema ve yayın`
            : "İşletme bilgileri, tema ve yayın ayarları"
        }
        back={
          <Link
            href={DASHBOARD_ROUTES.digitalMenuEdit(qrId)}
            aria-label="Menü düzenleyiciye dön"
            className={DASHBOARD_BACK}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

      {menuId != null ? (
        <div className={`${DASHBOARD_SURFACE} p-4 sm:p-6`}>
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

      {menuId != null ? (
        <div className={`${DASHBOARD_PANEL} border-destructive/30`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">Menüyü sil</h2>
              <p className="text-xs text-muted-foreground">
                Menü ve bağlı QR kodu kalıcı olarak silinmez; soft delete uygulanır. Menü kotanız geri açılır.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" className="gap-2" disabled={deleting}>
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Menüyü Sil
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Menü silinsin mi?</AlertDialogTitle>
                  <AlertDialogDescription>
                    <span className="font-medium">{profile?.businessName ?? "Bu menü"}</span> ve bağlı QR kodu
                    devre dışı bırakılır. Bu işlem geri alınamaz.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void handleDeleteMenu()}>Sil</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ) : null}
    </div>
  );
}
