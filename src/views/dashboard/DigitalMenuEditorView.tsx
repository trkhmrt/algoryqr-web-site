"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";

import DigitalMenuEditorSection from "@/components/dashboard/menu/DigitalMenuEditorSection";
import MenuCategoriesPanel from "@/components/dashboard/menu/MenuCategoriesPanel";
import MenuProductsPanel from "@/components/dashboard/menu/MenuProductsPanel";
import { MenuDetails, createInitialMenuData, type MenuData, type MenuUrlMode } from "@/components/dashboard/qr-create/MenuDetails";
import { resolveMenuThemeId } from "@/components/menu-templates/registry";
import { Button } from "@/components/ui/button";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { useAccessProfile } from "@/hooks/use-access-profile";
import { ApiError, getMenuByQrIdRequest, getUserQrsRequest, updateMenuRequest } from "@/lib/api";
import { hasScope } from "@/lib/auth-user";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

type DigitalMenuEditorViewProps = {
  qrId: number;
};

type EditorSection = "categories" | "products" | "menu";

export default function DigitalMenuEditorView({ qrId }: DigitalMenuEditorViewProps) {
  const router = useRouter();
  const { notify } = useDashboardBanners();
  const { data: accessProfile, isLoading: accessLoading } = useAccessProfile();
  const canUseDigitalMenu = hasScope(accessProfile, "QR_MENU_OWNER");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuData>(createInitialMenuData());
  const [openSection, setOpenSection] = useState<EditorSection | null>("categories");
  const [presetCategoryId, setPresetCategoryId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await getMenuByQrIdRequest(qrId);
      const urlModeRaw = String(profile.urlMode ?? "ID").toLowerCase();
      const urlMode: MenuUrlMode = urlModeRaw === "slug" ? "slug" : "id";
      const themeId = resolveMenuThemeId(profile.themeId);
      setMenuId(profile.menuId);
      setPublicUrl(profile.publicUrl);
      setMenu({
        businessName: profile.businessName ?? "",
        slogan: profile.slogan ?? "",
        phone: profile.phone ?? "",
        email: profile.email ?? "",
        address: profile.address ?? "",
        themeId,
        urlMode,
        publicSlug: profile.publicSlug ?? "",
      });
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Menü yüklenemedi.");
      router.push(DASHBOARD_ROUTES.digitalMenu);
    } finally {
      setLoading(false);
    }
  }, [notify, qrId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const qrs = await getUserQrsRequest("me");
        const match = qrs.find((item) => item.qrId === qrId);
        if (!cancelled && match?.imgSrc) setImgSrc(match.imgSrc);
      } catch {
        if (!cancelled) setImgSrc(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qrId]);

  const handleSectionChange = (section: EditorSection, open: boolean) => {
    setOpenSection(open ? section : null);
  };

  const handleAddProductFromCategory = (categoryId: number) => {
    setPresetCategoryId(categoryId);
    setOpenSection("products");
  };

  const saveProfile = async () => {
    if (menuId == null) return;
    if (!menu.businessName.trim()) {
      notify("warning", "Firma adı zorunlu.");
      return;
    }
    if (menu.urlMode === "slug" && !menu.publicSlug.trim()) {
      notify("warning", "Özel adres (slug) zorunlu.");
      return;
    }
    setSaving(true);
    try {
      const profile = await updateMenuRequest(menuId, {
        businessName: menu.businessName.trim(),
        slogan: menu.slogan.trim(),
        phone: menu.phone.trim(),
        email: menu.email.trim(),
        address: menu.address.trim(),
        themeId: menu.themeId,
        urlMode: menu.urlMode.toUpperCase(),
        publicSlug: menu.urlMode === "slug" ? menu.publicSlug.trim() : undefined,
      });
      setPublicUrl(profile.publicUrl);
      notify("info", "Menü bilgileri güncellendi.");
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Menü güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  if (accessLoading || loading) {
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
        <p className="text-sm text-muted-foreground">Bu menüyü düzenlemek için PRO paket gerekir.</p>
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
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{menu.businessName || "Menü Düzenle"}</h1>
          <p className="text-sm text-muted-foreground">Kategoriler, ürünler ve menü bilgilerini yönetin.</p>
        </div>
        {publicUrl && (
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href={publicUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              Aç
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {menuId != null && (
            <>
              <DigitalMenuEditorSection
                title="Kategoriler"
                description="Ana ve alt kategorileri oluşturun, ürün ekleyin."
                open={openSection === "categories"}
                onOpenChange={(open) => handleSectionChange("categories", open)}
              >
                <MenuCategoriesPanel menuId={menuId} onAddProduct={handleAddProductFromCategory} />
              </DigitalMenuEditorSection>

              <DigitalMenuEditorSection
                title="Ürünler"
                description="Ürünleri kategorilere bağlayın."
                open={openSection === "products"}
                onOpenChange={(open) => handleSectionChange("products", open)}
              >
                <MenuProductsPanel
                  menuId={menuId}
                  presetCategoryId={presetCategoryId}
                  onPresetConsumed={() => setPresetCategoryId(null)}
                />
              </DigitalMenuEditorSection>

              <DigitalMenuEditorSection
                title="Menü"
                description="İşletme bilgileri, tema ve yayın ayarları."
                open={openSection === "menu"}
                onOpenChange={(open) => handleSectionChange("menu", open)}
              >
                <div className="space-y-5">
                  <MenuDetails value={menu} onChange={setMenu} excludeMenuId={menuId ?? undefined} />
                  <div className="flex justify-end">
                    <Button type="button" disabled={saving} onClick={() => void saveProfile()}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kaydet"}
                    </Button>
                  </div>
                </div>
              </DigitalMenuEditorSection>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-sm font-medium text-foreground">QR Kod</h2>
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-muted">
              {imgSrc ? (
                <img src={`data:image/png;base64,${imgSrc}`} alt="Menü QR" className="h-full w-full object-cover" />
              ) : (
                <p className="text-xs text-muted-foreground">QR görseli yükleniyor…</p>
              )}
            </div>
            {publicUrl && <p className="mt-3 break-all text-xs text-muted-foreground">{publicUrl}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
