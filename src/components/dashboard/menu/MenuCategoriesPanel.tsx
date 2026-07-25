"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, FolderPlus, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createMenuCategoryRequest,
  deleteMenuCategoryRequest,
  MenuCategoryApiItem,
  updateMenuCategoryRequest,
} from "@/lib/api";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { invalidateMenuCategories, useMenuCategoriesByQr } from "@/hooks/use-menu-categories";
import { invalidateMenuProducts } from "@/hooks/use-menu-products";

type MenuCategoriesPanelProps = {
  menuId: number;
  qrId: number;
  onAddProduct?: (categoryId: number) => void;
};

type CategoryFormState = {
  name: string;
  parentId: number | null;
  editingId: number | null;
};

const emptyForm = (parentId: number | null = null): CategoryFormState => ({
  name: "",
  parentId,
  editingId: null,
});

function CategoryNode({
  category,
  depth,
  onAddChild,
  onEdit,
  onDelete,
  onAddProduct,
}: {
  category: MenuCategoryApiItem;
  depth: number;
  onAddChild: (parentId: number) => void;
  onEdit: (category: MenuCategoryApiItem) => void;
  onDelete: (categoryId: number) => void;
  onAddProduct?: (categoryId: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div
        className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2"
        style={{ marginLeft: depth * 16 }}
      >
        <div className="flex min-w-0 items-center gap-2">
          {depth > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          <span className="truncate text-sm font-medium">{category.name}</span>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => onAddChild(category.categoryId)}>
            <FolderPlus className="mr-1 h-3.5 w-3.5" />
            Alt
          </Button>
          {onAddProduct ? (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => onAddProduct(category.categoryId)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Ürün
            </Button>
          ) : null}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(category)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => void onDelete(category.categoryId)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {(category.children ?? []).map((child) => (
        <CategoryNode
          key={child.categoryId}
          category={child}
          depth={depth + 1}
          onAddChild={onAddChild}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddProduct={onAddProduct}
        />
      ))}
    </div>
  );
}

export default function MenuCategoriesPanel({ menuId, qrId, onAddProduct }: MenuCategoriesPanelProps) {
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const categoriesQuery = useMenuCategoriesByQr(qrId);
  const categories = categoriesQuery.data?.categories ?? [];
  const resolvedMenuId = categoriesQuery.data?.menuId ?? menuId;
  const loading = categoriesQuery.isLoading;
  const [form, setForm] = useState<CategoryFormState | null>(null);

  useEffect(() => {
    if (categoriesQuery.isError) {
      notify(
        "danger",
        categoriesQuery.error instanceof Error
          ? categoriesQuery.error.message
          : "Kategoriler yüklenemedi.",
      );
    }
  }, [categoriesQuery.error, categoriesQuery.isError, notify]);

  const resetForm = () => setForm(null);

  const refreshAfterCategoryChange = async () => {
    await Promise.all([
      invalidateMenuCategories(queryClient, resolvedMenuId, qrId),
      invalidateMenuProducts(queryClient, resolvedMenuId, qrId),
    ]);
  };

  const handleSubmit = async () => {
    if (!form || !form.name.trim()) {
      notify("warning", "Kategori adı zorunlu.");
      return;
    }

    try {
      if (form.editingId != null) {
        const current = findCategory(categories, form.editingId);
        await updateMenuCategoryRequest(form.editingId, {
          name: form.name.trim(),
          parentId: current?.parentId ?? null,
          sortOrder: current?.sortOrder,
        });
        notify("info", "Kategori güncellendi.");
      } else {
        await createMenuCategoryRequest(resolvedMenuId, {
          name: form.name.trim(),
          parentId: form.parentId,
        });
        notify("info", "Kategori eklendi.");
      }
      resetForm();
      await refreshAfterCategoryChange();
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "Kategori kaydedilemedi.");
    }
  };

  const handleDelete = async (categoryId: number) => {
    try {
      await deleteMenuCategoryRequest(categoryId);
      notify("info", "Kategori silindi.");
      await refreshAfterCategoryChange();
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "Kategori silinemedi.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Ana ve alt kategorileri yönetin.</p>
        <Button size="sm" className="gap-1.5" onClick={() => setForm(emptyForm(null))}>
          <Plus className="h-3.5 w-3.5" />
          Ana Kategori
        </Button>
      </div>

      {form && (
        <div className="rounded-lg border border-border/70 bg-background p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">
              {form.editingId != null
                ? "Kategori Adı"
                : form.parentId != null
                  ? "Alt Kategori Adı"
                  : "Ana Kategori Adı"}
            </Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void handleSubmit()}>
              {form.editingId != null ? "Güncelle" : "Kaydet"}
            </Button>
            <Button size="sm" variant="outline" onClick={resetForm}>
              İptal
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      ) : categories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">Henüz kategori eklenmedi.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Menünüze ürün eklemek için önce bir ana kategori oluşturun.
          </p>
          <Button size="sm" className="mt-4 gap-1.5" onClick={() => setForm(emptyForm(null))}>
            <Plus className="h-3.5 w-3.5" />
            İlk kategoriyi ekle
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <CategoryNode
              key={category.categoryId}
              category={category}
              depth={0}
              onAddChild={(parentId) => setForm(emptyForm(parentId))}
              onEdit={(item) =>
                setForm({
                  name: item.name,
                  parentId: item.parentId ?? null,
                  editingId: item.categoryId,
                })
              }
              onDelete={handleDelete}
              onAddProduct={onAddProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function findCategory(categories: MenuCategoryApiItem[], categoryId: number): MenuCategoryApiItem | null {
  for (const category of categories) {
    if (category.categoryId === categoryId) return category;
    const child = findCategory(category.children ?? [], categoryId);
    if (child) return child;
  }
  return null;
}
