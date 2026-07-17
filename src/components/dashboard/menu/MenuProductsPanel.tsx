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
  flattenMenuCategories,
  getMenuCategoriesRequest,
  getMenuProductsRequest,
  MenuCategoryApiItem,
  MenuProductApiItem,
  MenuProductRequestBody,
  updateMenuProductRequest,
} from "@/lib/api";
import { useDashboardBanners } from "@/contexts/dashboard-banners";

type MenuProductsPanelProps = {
  menuId: number;
  presetCategoryId?: number | null;
  onPresetConsumed?: () => void;
};

const emptyForm = (categoryId?: number | null): MenuProductRequestBody => ({
  name: "",
  description: "",
  price: "",
  currency: "TRY",
  categoryId: categoryId ?? null,
  imageUrl: "",
  available: true,
});

export default function MenuProductsPanel({
  menuId,
  presetCategoryId,
  onPresetConsumed,
}: MenuProductsPanelProps) {
  const { notify } = useDashboardBanners();
  const [products, setProducts] = useState<MenuProductApiItem[]>([]);
  const [categories, setCategories] = useState<MenuCategoryApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MenuProductRequestBody>(emptyForm());
  const [showForm, setShowForm] = useState(false);
  const [filterCategoryId, setFilterCategoryId] = useState<number | "all">("all");

  const categoryOptions = flattenMenuCategories(categories);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [productData, categoryData] = await Promise.all([
        getMenuProductsRequest(menuId),
        getMenuCategoriesRequest(menuId),
      ]);
      setProducts(productData);
      setCategories(categoryData);
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "Menü ürünleri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [menuId, notify]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (presetCategoryId == null) return;
    setForm(emptyForm(presetCategoryId));
    setEditingId(null);
    setShowForm(true);
    setFilterCategoryId(presetCategoryId);
    onPresetConsumed?.();
  }, [presetCategoryId, onPresetConsumed]);

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
      await loadData();
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
      categoryId: product.categoryId ?? null,
      imageUrl: product.imageUrl ?? "",
      available: product.available,
    });
    setShowForm(true);
  };

  const handleDelete = async (productId: number) => {
    try {
      await deleteMenuProductRequest(productId);
      notify("info", "Ürün silindi.");
      await loadData();
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "Ürün silinemedi.");
    }
  };

  const visibleProducts =
    filterCategoryId === "all"
      ? products
      : products.filter((product) => product.categoryId === filterCategoryId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Kategori filtresi</Label>
          <select
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            value={filterCategoryId === "all" ? "all" : String(filterCategoryId)}
            onChange={(e) =>
              setFilterCategoryId(e.target.value === "all" ? "all" : Number(e.target.value))
            }
          >
            <option value="all">Tümü</option>
            {categoryOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => {
            resetForm();
            setForm(emptyForm(filterCategoryId === "all" ? null : filterCategoryId));
            setShowForm(true);
          }}
        >
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
              <select
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={form.categoryId ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    categoryId: e.target.value ? Number(e.target.value) : null,
                  })
                }
              >
                <option value="">Kategori seçin</option>
                {categoryOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fiyat</Label>
              <Input
                value={String(form.price ?? "")}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="120"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Açıklama</Label>
              <Textarea
                rows={2}
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Görsel URL</Label>
              <Input
                value={form.imageUrl ?? ""}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void handleSubmit()}>
              {editingId != null ? "Güncelle" : "Kaydet"}
            </Button>
            <Button size="sm" variant="outline" onClick={resetForm}>
              İptal
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      ) : visibleProducts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Bu filtrede ürün yok.</p>
      ) : (
        <div className="space-y-2">
          {visibleProducts.map((product) => (
            <div
              key={product.productId}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[
                    product.categoryPath || product.categoryName || product.category,
                    product.price ? `${product.price} ${product.currency}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(product)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => void handleDelete(product.productId)}
                >
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
