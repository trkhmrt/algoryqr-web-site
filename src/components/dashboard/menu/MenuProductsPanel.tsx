"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createMenuProductRequest,
  deleteMenuProductRequest,
  getMenuProductsRequest,
  MenuProductApiItem,
  MenuProductRequestBody,
  updateMenuProductRequest,
} from "@/lib/api";
import { useDashboardBanners } from "@/contexts/dashboard-banners";

type MenuProductsPanelProps = {
  menuId: number;
};

const emptyForm = (): MenuProductRequestBody => ({
  name: "",
  description: "",
  price: "",
  currency: "TRY",
  category: "",
  imageUrl: "",
  available: true,
});

export default function MenuProductsPanel({ menuId }: MenuProductsPanelProps) {
  const { notify } = useDashboardBanners();
  const [products, setProducts] = useState<MenuProductApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MenuProductRequestBody>(emptyForm());
  const [showForm, setShowForm] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMenuProductsRequest(menuId);
      setProducts(data);
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "Menü ürünleri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [menuId, notify]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.name?.trim()) {
      notify("warning", "Ürün adı zorunlu.");
      return;
    }

    try {
      if (editingId != null) {
        await updateMenuProductRequest(editingId, form);
        notify("info", "Ürün güncellendi.");
      } else {
        await createMenuProductRequest(menuId, form);
        notify("info", "Ürün eklendi.");
      }
      resetForm();
      await loadProducts();
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "İşlem başarısız.");
    }
  };

  const handleEdit = (product: MenuProductApiItem) => {
    setEditingId(product.productId);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: product.price ?? "",
      currency: product.currency,
      category: product.category ?? "",
      imageUrl: product.imageUrl ?? "",
      available: product.available,
    });
    setShowForm(true);
  };

  const handleDelete = async (productId: number) => {
    try {
      await deleteMenuProductRequest(productId);
      notify("info", "Ürün silindi.");
      await loadProducts();
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "Ürün silinemedi.");
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">Menü Ürünleri</h2>
          <p className="text-xs text-muted-foreground">Kategorilere göre ürün ekleyin.</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-3.5 w-3.5" />
          Ürün Ekle
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-border/70 bg-background p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Ürün Adı</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Kategori</Label>
              <Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ana Yemek" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fiyat</Label>
              <Input value={String(form.price ?? "")} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="120" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Açıklama</Label>
              <Textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Görsel URL</Label>
              <Input value={form.imageUrl ?? ""} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void handleSubmit()}>{editingId != null ? "Güncelle" : "Kaydet"}</Button>
            <Button size="sm" variant="outline" onClick={resetForm}>İptal</Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz ürün eklenmedi.</p>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <div key={product.productId} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[product.category, product.price ? `${product.price} ${product.currency}` : null].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(product)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => void handleDelete(product.productId)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
