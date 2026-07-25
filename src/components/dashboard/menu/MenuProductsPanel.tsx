"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createMenuProductRequest,
  deleteMenuProductRequest,
  flattenMenuCategories,
  MenuProductApiItem,
  MenuProductRequestBody,
  NutritionBasis,
  NutritionFacts,
  updateMenuProductRequest,
} from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import {
  buildNutritionFactsFromForm,
  emptyNutritionFacts,
} from "@/components/dashboard/menu/ProductNutritionPanel";
import { useMenuCategoriesByQr } from "@/hooks/use-menu-categories";
import {
  invalidateMenuProducts,
  useMenuProductsByQr,
} from "@/hooks/use-menu-products";

type MenuProductsPanelProps = {
  menuId: number;
  qrId: number;
  presetCategoryId?: number | null;
  onPresetConsumed?: () => void;
};

type NutritionFormFields = {
  basis: NutritionBasis;
  energyKj: string;
  energyKcal: string;
  fat: string;
  saturatedFat: string;
  carbohydrate: string;
  sugars: string;
  fibre: string;
  protein: string;
  salt: string;
};

const emptyNutritionForm = (): NutritionFormFields => ({
  basis: "PER_100G",
  energyKj: "",
  energyKcal: "",
  fat: "",
  saturatedFat: "",
  carbohydrate: "",
  sugars: "",
  fibre: "",
  protein: "",
  salt: "",
});

const emptyForm = (categoryId?: number | null): MenuProductRequestBody => ({
  name: "",
  description: "",
  price: "",
  currency: "TRY",
  categoryId: categoryId ?? null,
  imageUrl: "",
  available: true,
  nutrition: emptyNutritionFacts(),
});

export default function MenuProductsPanel({
  menuId,
  qrId,
  presetCategoryId,
  onPresetConsumed,
}: MenuProductsPanelProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const productsQuery = useMenuProductsByQr(qrId);
  const categoriesQuery = useMenuCategoriesByQr(qrId);
  const products = productsQuery.data?.content ?? [];
  const categories = categoriesQuery.data?.categories ?? [];
  const resolvedMenuId = productsQuery.data?.menuId ?? menuId;
  const loading = productsQuery.isLoading || categoriesQuery.isLoading;
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MenuProductRequestBody>(emptyForm());
  const [nutritionForm, setNutritionForm] = useState<NutritionFormFields>(emptyNutritionForm());
  const [showForm, setShowForm] = useState(false);
  const [filterCategoryId, setFilterCategoryId] = useState<number | "all">("all");

  const categoryOptions = flattenMenuCategories(categories);

  useEffect(() => {
    if (productsQuery.isError) {
      notify(
        "danger",
        productsQuery.error instanceof Error
          ? productsQuery.error.message
          : "Menü ürünleri yüklenemedi.",
      );
    }
  }, [notify, productsQuery.error, productsQuery.isError]);

  useEffect(() => {
    if (presetCategoryId == null) return;
    setForm(emptyForm(presetCategoryId));
    setNutritionForm(emptyNutritionForm());
    setEditingId(null);
    setShowForm(true);
    setFilterCategoryId(presetCategoryId);
    onPresetConsumed?.();
  }, [presetCategoryId, onPresetConsumed]);

  const resetForm = () => {
    setForm(emptyForm());
    setNutritionForm(emptyNutritionForm());
    setEditingId(null);
    setShowForm(false);
  };

  const resolveNutritionPayload = (): NutritionFacts | null => {
    if (editingId != null) {
      return form.nutrition ?? null;
    }
    return buildNutritionFactsFromForm(nutritionForm);
  };

  const refreshProducts = () => invalidateMenuProducts(queryClient, resolvedMenuId, qrId);

  const handleSubmit = async () => {
    if (!form.name?.trim()) {
      notify("warning", "Ürün adı zorunlu.");
      return;
    }

    const nutrition = resolveNutritionPayload();
    if (editingId == null && !nutrition) {
      notify("warning", "Zorunlu besin alanlarını doldurun.");
      return;
    }

    const payload: MenuProductRequestBody = {
      ...form,
      nutrition: nutrition ?? undefined,
    };

    try {
      if (editingId != null) {
        await updateMenuProductRequest(editingId, payload);
        notify("info", "Ürün güncellendi.");
        resetForm();
        await refreshProducts();
      } else {
        const created = await createMenuProductRequest(resolvedMenuId, payload);
        notify("info", "Ürün eklendi.");
        resetForm();
        await refreshProducts();
        if (qrId != null) {
          router.push(DASHBOARD_ROUTES.digitalMenuProductDetail(created.productId, qrId));
        }
      }
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
      nutrition: product.nutrition ?? undefined,
    });
    setShowForm(true);
  };

  const handleDelete = async (productId: number) => {
    try {
      await deleteMenuProductRequest(productId);
      notify("info", "Ürün silindi.");
      await refreshProducts();
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
            setNutritionForm(emptyNutritionForm());
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

          {editingId == null ? (
            <div className="space-y-3 rounded-md border border-border/60 p-3">
              <p className="text-xs font-medium text-foreground">Besin değerleri (zorunlu)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Birim</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                    value={nutritionForm.basis}
                    onChange={(e) =>
                      setNutritionForm({ ...nutritionForm, basis: e.target.value as NutritionBasis })
                    }
                  >
                    <option value="PER_100G">100g başına</option>
                    <option value="PER_100ML">100ml başına</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Enerji (kJ)</Label>
                  <Input
                    value={nutritionForm.energyKj}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, energyKj: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Enerji (kcal)</Label>
                  <Input
                    value={nutritionForm.energyKcal}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, energyKcal: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Yağ</Label>
                  <Input
                    value={nutritionForm.fat}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, fat: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Karbonhidrat</Label>
                  <Input
                    value={nutritionForm.carbohydrate}
                    onChange={(e) =>
                      setNutritionForm({ ...nutritionForm, carbohydrate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Lif</Label>
                  <Input
                    value={nutritionForm.fibre}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, fibre: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Protein</Label>
                  <Input
                    value={nutritionForm.protein}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, protein: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tuz</Label>
                  <Input
                    value={nutritionForm.salt}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, salt: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ) : null}

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
                {qrId != null ? (
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={DASHBOARD_ROUTES.digitalMenuProductDetail(product.productId, qrId)}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                ) : null}
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
