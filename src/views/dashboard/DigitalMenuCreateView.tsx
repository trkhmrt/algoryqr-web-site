"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";

import { MenuDetails, createInitialMenuData, type MenuData } from "@/components/dashboard/qr-create/MenuDetails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { useAccessProfile } from "@/hooks/use-access-profile";
import { invalidatePackageUsage } from "@/hooks/use-package-usage";
import { invalidateUserQrs } from "@/hooks/use-user-qrs";
import { ApiError, createQrRequest, getStoredUser } from "@/lib/api";
import { hasScope } from "@/lib/auth-user";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { buildMenuCreateDetails } from "@/lib/menu-create";

type DraftProduct = {
  key: string;
  name: string;
  category: string;
  price: string;
  description: string;
};

const emptyProduct = (): DraftProduct => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: "",
  category: "",
  price: "",
  description: "",
});

export default function DigitalMenuCreateView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const { data: accessProfile, isLoading: accessLoading } = useAccessProfile();
  const canUseDigitalMenu = hasScope(accessProfile, "QR_MENU_OWNER");
  const [menu, setMenu] = useState<MenuData>(createInitialMenuData());
  const [products, setProducts] = useState<DraftProduct[]>([emptyProduct()]);
  const [saving, setSaving] = useState(false);

  const updateProduct = (key: string, patch: Partial<DraftProduct>) => {
    setProducts((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const removeProduct = (key: string) => {
    setProducts((prev) => (prev.length <= 1 ? prev : prev.filter((item) => item.key !== key)));
  };

  const submit = async () => {
    if (!canUseDigitalMenu) {
      notify("warning", "Menü QR oluşturmak için PRO paket gerekli.");
      return;
    }
    if (!menu.businessName.trim()) {
      notify("warning", "Firma adı zorunlu.");
      return;
    }
    if (menu.urlMode === "slug" && !menu.publicSlug.trim()) {
      notify("warning", "Özel adres (slug) zorunlu.");
      return;
    }

    const validProducts = products
      .map((item) => ({
        name: item.name.trim(),
        category: item.category.trim() || undefined,
        description: item.description.trim() || undefined,
        price: item.price.trim() ? Number(item.price.replace(",", ".")) : undefined,
        currency: "TRY",
        available: true,
      }))
      .filter((item) => item.name.length > 0);

    for (const item of validProducts) {
      if (item.price != null && !Number.isFinite(item.price)) {
        notify("warning", "Ürün fiyatı geçersiz.");
        return;
      }
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
            urlMode: menu.urlMode,
            publicSlug: menu.publicSlug.trim() || undefined,
          },
          validProducts,
        ),
      });
      await invalidatePackageUsage(queryClient);
      const storedUser = getStoredUser();
      await invalidateUserQrs(queryClient, storedUser?.id != null ? String(storedUser.id) : "me");
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
          <p className="text-sm text-muted-foreground">Firma adı, slogan ve ürünlerinizi ekleyin.</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-5">
        <h2 className="text-sm font-medium text-foreground">İşletme Bilgileri</h2>
        <MenuDetails value={menu} onChange={setMenu} />
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-foreground">Ürünler</h2>
            <p className="text-xs text-muted-foreground">İsterseniz şimdi ekleyin; sonra da düzenleyebilirsiniz.</p>
          </div>
          <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => setProducts((prev) => [...prev, emptyProduct()])}>
            <Plus className="h-3.5 w-3.5" />
            Ürün Ekle
          </Button>
        </div>

        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={product.key} className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Ürün {index + 1}</p>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeProduct(product.key)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Ürün adı</Label>
                  <Input value={product.name} onChange={(e) => updateProduct(product.key, { name: e.target.value })} className="bg-background" placeholder="Espresso" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Kategori</Label>
                  <Input value={product.category} onChange={(e) => updateProduct(product.key, { category: e.target.value })} className="bg-background" placeholder="İçecekler" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Fiyat</Label>
                  <Input value={product.price} onChange={(e) => updateProduct(product.key, { price: e.target.value })} className="bg-background" placeholder="120" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Açıklama</Label>
                <Textarea value={product.description} onChange={(e) => updateProduct(product.key, { description: e.target.value })} className="bg-background" rows={2} />
              </div>
            </div>
          ))}
        </div>
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
